<?php

$DATA_FILE = "data.json";

header("Content-Type: text/json");
header("Access-Control-Allow-Origin: *");

function send_obj($ok, $obj = []){
    echo json_encode(array_merge(["ok" => $ok], $obj));
    exit(0);
}

function send_error($message, $obj = []){
    send_obj(FALSE, array_merge(["error" => $message], $obj));
}

function scanStr($str){
    $specialChars = ".,?!:;+-*/\\\"'`()[]{}~@#$%^&=<>";
    $whiteSpace = " \n\r\t\f\v";
    $result = [];
    $next = "";
    for($i = 0; $i < strlen($str); $i++){
        $ch = $str[$i];
        if(strpos($whiteSpace, $ch) !== false){
            if(strlen($next) > 0){
                array_push($result, $next);
                $next = "";
            }
        }
        else if(strpos($specialChars, $ch) !== false){
            if(strlen($next) > 0){
                array_push($result, $next);
                $next = "";
            }
            array_push($result, $ch);
        }
        else{
            $next .= $ch;
        }
    }
    if(strlen($next) > 0){
        array_push($result, $next);
    }
    return $result;
}

function getTokenScore($a, $b){
    $length = min(strlen($a), strlen($b));
    $count = 0;
    while ($count < $length && strtolower($a[$count]) == strtolower($b[$count]))
    {
        $count++;
    }
    return $count;
}

function scoreStr($a, $b){
    // Tokenize inputs
    $aTokens = scanStr($a);
    $bTokens = scanStr($b);

    // Loop through comparison table of all tokens
    $totalScore = 0;
    for($i = 0; $i < count($aTokens); $i++){
        for($j = 0; $j < count($bTokens); $j++){
            $score = getTokenScore($aTokens[$i], $bTokens[$j]); // Get string similarity for tokens
            $score /= 1 + sqrt(pow($i - $j, 2) * 2);  // Divide by the distance to the identity line
            $totalScore += $score;
        }
    }
    return $totalScore;
}


function fullScoreStr($a, $b){
    return scoreStr($a, $b) + scoreStr($b, $a);
}


if(!isset($_REQUEST["prompt"])){
    send_error("No prompt provided.");
}

$prompt = $_REQUEST["prompt"];
$data = json_decode(file_get_contents($DATA_FILE), TRUE);

if(isset($_REQUEST["answer"])){
    $answer = $_REQUEST["answer"];
    $data[$prompt] = $answer;
    file_put_contents($DATA_FILE, json_encode($data));
    send_obj(TRUE, ["prompt" => $prompt, "answer" => $answer]);
}
else{
    if(count($data) == 0){
        send_error("No data.");
    }

    $max_score = -1;
    $best_index = -1;
    $keys = array_keys($data);
    $values = array_values($data);

    for($i = 0; $i < count($keys); $i++){
        $next_score = fullScoreStr($prompt, $keys[$i]);
        if($prompt == $keys[$i]){
            $max_score = $next_score;
            $best_index = $i;
            break;
        }
        if($next_score >= $max_score){
            $max_score = $next_score;
            $best_index = $i;
        }
    }

    $answer = $values[$best_index];
    $best_prompt = $keys[$best_index];

    send_obj(TRUE, [
        "prompt" => $prompt,
        "best_prompt" => $best_prompt,
        "answer" => $answer,
        "score" => $max_score]);
}
?>