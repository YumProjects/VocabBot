/*
**** XSS element wrapper class ****
*/

class QElem {

    element;

    constructor(elem = undefined){
        if(elem == undefined){
            this.element = document.documentElement;
        }
        else if(typeof(elem) == "string"){
            this.element = document.querySelector(elem);
        }
        else{
            this.element = elem;
        }
    }

    all(selector = undefined){
        var elements;
        if(selector == undefined){
            elements = this.element.childNodes;
        }
        else{
            elements = this.element.querySelectorAll(selector);
        }
        var result = [];
        for(var i = 0; i < elements.length; i++){
            result.push(new QElem(elements[i]));
        }
        return result;
    }

    first(selector = undefined){
        if(selector == undefined){
            return new QElem(this.element.firstChild);
        }
        var element = this.element.querySelector(selector);
        if(element == undefined){
            return;
        }
        else{
            return new QElem(element);
        }
    }
    
    last(selector = undefined){
        if(selector == undefined){
            return new QElem(this.element.lastChild);
        }
        var all = this.element.querySelectorAll(selector);
        if(all.length == 0){
            return;
        }
        else{
            return new QElem(all[all.length - 1]);
        }
    }
    
    exists(selector){
        return (this.element.querySelector(selector) != undefined);
    }
    
    hasClass(className) {
        return this.element.classList.contains(className);
    }
    
    classList(){
        return this.element.classList;
    }
    
    click(){
        this.element.click();
    }
    
    html(){
        return this.element.innerHTML;
    }
    
    text(){
        return this.element.innerText;
    }

    attribute(name){
        return this.element.getAttribute(name);
    }
}

const _ = new QElem();


/*
**** HTTP functions ****
*/

const SERVER_URL = "http://localhost/server.php";

async function delay(ms){
    await new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

// Set an async HTTP GET request
async function getRequest(url){
    return await new Promise((resolve, reject) => {
        var req = new XMLHttpRequest();
        req.onreadystatechange = function(ev) {
            if(req.readyState == XMLHttpRequest.DONE){
                if(req.status == 200){
                    resolve(req.responseText);
                }
                else{
                    reject(req.status);
                }
            }
        };
        req.onerror = function(ev){
            reject(req.readyState);  
        };
        req.open("GET", url);
        req.send();
    })
}

async function getServerGuess(prompt){
    var res = await getRequest(SERVER_URL + "?prompt=" + prompt);
    return JSON.parse(res)["answer"];
}

async function trainServer(prompt, answer) {
    var res = await getRequest(SERVER_URL + "?prompt=" + prompt + "&answer=" + answer);
    return JSON.parse(res);
}


/*
**** Text processing ****
*/

// Converts a string into a set of tokens
function scanStr(str){
    var specialChars = ".,?!:;+-*/\\\"'`()[]{}~@#$%^&=<>";
    var whiteSpace = " \n\r\t\f\v";
    var result = [];
    var next = "";
    for(var i = 0; i < str.length; i++){
        var ch = str.charAt(i);
        if(whiteSpace.includes(ch)){
            if(next.length > 0){
                result.push(next);
                next = "";
            }
        }
        else if(specialChars.includes(ch)){
            if(next.length > 0){
                result.push(next);
                next = "";
            }
            result.push(ch);
        }
        else{
            next += ch;
        }
    }
    if(next.length > 0){
        result.push(next);
    }
    return result;
}

// Counts the number of similar leading charaters in a token
function getTokenScore(a, b){
    var length = Math.max(a.length, b.length);
    var count = 0;
    while ((count < length) && (a.charAt(count).toLowerCase() == b.charAt(count).toLowerCase()))
    {
        count++;
    }
    return count;
}

// Calculates the similarity score of two strings
function scoreString(a, b){
    // Tokenize inputs
    var aTokens = scanStr(a);
    var bTokens = scanStr(b);

    // Loop through comparison table of all tokens
    var totalScore = 0;
    for(var i = 0; i < aTokens.length; i++){
        for(var j = 0; j < bTokens.length; j++){
            var score = getTokenScore(aTokens[i], bTokens[j]); // Get string similarity for tokens
            score /= 1 + Math.sqrt(Math.pow(i - j, 2) * 2);  // Divide by the distance to the identity line
            totalScore += score;
        }
    }
    return totalScore;
}


/*
**** Bot core ****
*/

async function clickNext(){
    _.last(".next").click();
    await delay(1500);
}

function isSummary(question){
    return question.hasClass("summary");
}

function isSpelling(question){
    return question.exists(".spelltheword");
}

function isImage(question){
    return question.exists(".typeI");
}

function isCorrect(choice){
    return choice.hasClass("correct");
}

// Return the best UI choice for a guess returned by server
function getBestChoice(guess, choices){
    if(choices.length == 1) return 0;
    var bestIndex = 0;
    var bestScore = -1;
    for(var i = 0; i < choices.length; i++){
        var nextScore = scoreString(guess, choices[i]);
        if(nextScore > bestScore){
            bestScore = nextScore;
            bestIndex = i;
        }
    }
    return bestIndex;
}

async function solveMC(question){
    console.log("Solving multiple choice...");
    var prompt = question.first(".instructions").text() + "\n" + question.first(".questionContent").text();
    var guess = await getServerGuess(prompt);

    var choices = question.first(".choices").all("a");
    var choicesText = [];
    for(var i = 0; i < choices.length; i++){
        choicesText.push(choices[i].text());
    }

    while(true){
        var bestIndex = getBestChoice(guess, choicesText);
        console.log("   [" + bestIndex + "] '" + choicesText[bestIndex] + "'");
        choices[bestIndex].click();
        await delay(700);
        if(isCorrect(choices[bestIndex])){
            if(choicesText.length < 4){
                await trainServer(prompt, choicesText[bestIndex]);
            }
            return;
        }

        // Remove the last guess from the available options
        choices.splice(bestIndex, 1);
        choicesText.splice(bestIndex, 1);
    }
}

async function solveSpelling(question){
    console.log("Solving spelling...");
    var spellBtn = question.first(".spellit");
    var giveUpBtn = question.first(".surrender");
    var textBox = question.first(".wordspelling");

    // Read first strong element from hidden pannel (probably the word)
    textBox.element.value = question.first(".complete").first("strong").text();
    await delay(100);
    spellBtn.click();

    if(question.first(".status").hasClass("correct")){
        await delay(500);
        return;
    }

    // Click twice for give up button, then give up
    await delay(100);
    spellBtn.click();
    await delay(100);
    spellBtn.click();
    await delay(100);
    giveUpBtn.click();
    await delay(500);
}

async function solveImage(question){
    console.log("Solving image...");
    var prompt = question.first(".wrapper").text();
    var guess = await getServerGuess(prompt);

    var choices = question.first(".choices").all("a");

    // Read style attribute from each image for URL
    var choicesText = [];
    for(var i = 0; i < choices.length; i++){
        choicesText.push(choices[i].attribute("style"));
    }

    while(true){
        var bestIndex = getBestChoice(guess, choicesText);
        console.log("   [Image #" + bestIndex + "]");
        choices[bestIndex].click();
        await delay(500);
        if(isCorrect(choices[bestIndex])){
            if(choicesText.length < 4){
                await trainServer(prompt, choicesText[bestIndex]);
            }
            return;
        }

        // Remove the last guess from the available options
        choices.splice(bestIndex, 1);
        choicesText.splice(bestIndex, 1);
    }
}

async function run(){
    var question = _.last(".questionPane").last();

    while(isSummary(question)){
        console.log("Skipping summary...");
        await clickNext();
        question = _.last(".questionPane").last();
    }

    if(isSpelling(question)){
        await solveSpelling(question);
    }
    else if(isImage(question)){
        await solveImage(question);
    }
    else{
        await solveMC(question);
    }

    await clickNext();
}

async function runAll(){
    while(true){
        await run();
    }
}

// Train on items scraped from a list page
async function trainList(){
    var wordList = _.first(".wordlist").all(".entry");
    for(var i = 0; i < wordList.length; i++){
        var word = wordList[i].first(".word").text();
        var definition = wordList[i].first(".definition").text();
        console.log("[" + i + "] '" + word + "': '" + definition + "'");
        await trainServer(word, definition);
        if(i < wordList.length - 1){
            await delay(500);
        }
    }
    console.log("Done.");
}