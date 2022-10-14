# bicoccaLessonUrlExtractor

## Table of Contents

- [About](#about)
- [Getting Started](#getting_started)
- [Usage](#usage)
- [Demo](#demo)

## About <a name = "about"></a>

Needed a fast way to watch accelerated lessons from e learning on ipad, after trying unsuccessfully few plugins i wrote this telegram bot to dowload the network url of the lesson to play in VLC Network section. Doing so i can accelerate the lesson as fast or as slow as i want.

In a second time i added also the ability to download lesson file of an entire page course
## Getting Started <a name = "getting_started"></a>

Since this project involves personal credential from the platform e-learning the istance of the bot is private for each person, so if you want to use it you have to create a new bot on telegram and configure the project on your server or local machine.
For creating the bot use [BotFather](https://telegram.me/BotFather) by telegram itself


### Installing

Clone the repo on your server or local machine

```
git clone https://github.com/ruggero95/bicoccaLessonsUrlExtractor.git
```

once you cloned it, create .env file for configuration. Just copy .evn.sample and rename it

```
cp .env.sample .env
```

Now in the .env add
-   key of the bot
- port of your app
- url of your app
- your telegram username for prevent access to other person
-   your user and password of e learning
## Usage <a name = "usage"></a>

just run, docker file incoming
```
npm start
```

## Demo <a name="demo"></a>

Lesson url download


https://user-images.githubusercontent.com/9202746/195870461-fcb1bb69-e24f-412f-b682-782b102164e6.mp4





