# VocabBot
VocabBot is a trainable vocab.com bot that is capable of answering multiple choice, spelling, and image selection questions. It will learn the answers to multiple choice and image selection questions, and should be able to answer spelling questions correctly 100% of the time.

**DISCLAIMER:** Use at your own risk. I am not responsible for any consequence of using this bot.


# Installation
* For this project you will need PHP. If you don’t already have it, I would recommend installing the [XAMPP server utility](https://www.apachefriends.org/download.html) which comes with PHP. Alternatively, you can download just PHP from [their website](https://www.php.net/downloads.php).

* Clone this repository: `git clone https://github.com/YumProjects/VocabBot.git`

# Using the Bot
* In the command line, from the root directory of the project, start the PHP development server...
```
php -S localhost:80
```

* Open vocab.com to the play screen of the list you want to play then open the developer tools (inspect).
* Go to the console and paste the following code to import the bot into the website...
```
var s = document.createElement("script");
s.src = "http://localhost/client.js";
document.body.appendChild(s);
```

(This bot will not work in Internet Explorer, you shouldn't be using it anyway, it's so old)

## Running the bot
* Enter `runAll()` in the console to start the bot.
* The bot will probably be really bad at first, but it will get better as it learns.

## Pre-training for a list
* Open a list to the screen that shows all the words and enter `trainList()` in the console to pre-train for a list.
* This may take a minute or so depending on the size of the list.
* Doing this won't have that much of an impact on the initial performance of the bot, but it will help a bit.