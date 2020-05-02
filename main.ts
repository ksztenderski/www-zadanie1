class QuestionTuple {
    question: string;
    answers: number[];
    correctAnswer: number;
    penalty: number;
}

class AnswerTuple {
    answer: number = null;
    timeSpent: number = 0;
}

class UserResult {
    question: QuestionTuple;
    answer: AnswerTuple;

    constructor(question: QuestionTuple, answer: AnswerTuple) {
        this.question = question;
        this.answer = answer;
    }
}

class ResultStorage {
    date: string;
    score: number;
    userResults: UserResult[];

    constructor(date: string, score: number, userResults: UserResult[]) {
        this.date = date;
        this.score = score;
        this.userResults = userResults;
    }
}

class QuizStats {
    storedResults: Array<ResultStorage> = localStorage.getItem('quizResults') != null ?
        JSON.parse(localStorage.getItem('quizResults')) : new Array<ResultStorage>();

    createLeaderboards() {
        let topScores = document.getElementById('top_scores');

        // Sets top scores table.
        if (this.storedResults.length > 0) {
            let topScoresHTML = new Array<string>();

            topScoresHTML.push(
                '<tr> <th colspan="2">Top Scores</th> </tr> <tr> <th>When</th> <th>Score</th> </tr>'
            );

            for (let i = 0; i < Math.min(this.storedResults.length, 5); i++) {
                let storedResult = (this.storedResults)[i];

                topScoresHTML.push(
                    `<tr>
                        <td>${storedResult.date}</td>
                        <td>${storedResult.score}</td>
                    </tr>`
                )
            }

            topScores.innerHTML = topScoresHTML.join('');
        }
    }

    saveResults(quiz: Quiz, userResults: UserResult[]) {
        let now = new Date();
        let when = now.toDateString() + ' ' + now.toTimeString().substr(0, now.toTimeString().indexOf(' '))
        this.storedResults.push(new ResultStorage(when, quiz.score, userResults));
        this.storedResults.sort((a, b) => a.score - b.score);
        localStorage.setItem('quizResults', JSON.stringify(this.storedResults));

        location.reload();
    }

    saveResultsWithStats(quiz: Quiz) {
        let userResults = new Array<UserResult>();

        for (let i = 0; i < quiz.questions.length; i++) {
            userResults.push(new UserResult(quiz.questions[i], quiz.answers[i]))
        }

        this.saveResults(quiz, userResults);
    }
}

class HtmlHandler {
    answersHTML = new Array<string>();
    penaltyBox = document.getElementById('penalty');
    startButton = document.getElementById('start_button');
    finishButton = document.getElementById('finish_button');
    cancelButton = document.getElementById('cancel_button');
    restartButton = document.getElementById('restart_button');
    nextQuestionButton = document.getElementById('next_question_button');
    previousQuestionButton = document.getElementById('previous_question_button');
    saveResultsWithStatsButton = document.getElementById('save_results_with_stats_button');
    saveResultsWithoutStatsButton = document.getElementById('save_results_without_stats_button');
    correctAnswerColor = '#21bf73';
    wrongAnswerColor = '#fd5e53';

    constructor(quiz: Quiz) {
        this.startButton.addEventListener('click', quiz.startQuiz);
        this.finishButton.addEventListener('click', quiz.finishQuiz);
        this.cancelButton.addEventListener('click', quiz.cancelQuiz);
        this.restartButton.addEventListener('click', () => location.reload());
        this.nextQuestionButton.addEventListener('click', quiz.nextQuestion);
        this.previousQuestionButton.addEventListener('click', quiz.previousQuestion);
        this.saveResultsWithStatsButton.addEventListener('click', () => quiz.quizStats.saveResultsWithStats(quiz));
        this.saveResultsWithoutStatsButton.addEventListener('click', () => quiz.quizStats.saveResults(quiz, null));
    }

    // Shuffles given array.
    shuffle(array: number[]) {
        let ctr = array.length, tmp, index: number;

        while (ctr > 0) {
            index = Math.floor(Math.random() * ctr);
            ctr--;
            tmp = array[ctr];
            array[ctr] = array[index];
            array[index] = tmp;
        }
        return array;
    }

    // Get all the answers as html elements.
    getAnswersHTML(questions: QuestionTuple[]) {
        for (let i = 0; i < questions.length; i++) {
            let question = questions[i];
            let currentAnswersHTML = new Array<string>();

            let shuffledAnswers = question.answers;

            this.shuffle(shuffledAnswers);

            for (const answer of shuffledAnswers) {
                currentAnswersHTML.push(
                    `<label class="radio radio_active">${answer}
                <input type="radio" name="question${i}" value="${answer}">
                <span class="checkmark"></span>
            </label>`);
            }

            this.answersHTML.push(
                '<div class="answer">' + currentAnswersHTML.join('') + '</div>'
            );
        }

        document.getElementById('answers').innerHTML = this.answersHTML.join('');
    }

    displayQuestion(quiz: Quiz) {
        document.getElementById('question_number').innerText = (quiz.currentQuestion + 1) + ' / ' + quiz.questions.length;
        document.getElementById('question').innerText = quiz.questions[quiz.currentQuestion].question;
        (document.getElementsByClassName('answer')[quiz.currentQuestion] as HTMLElement).style.display = 'block';

        if (quiz.quizTime) {
            this.penaltyBox.innerText = 'Penalty: ' + quiz.questions[quiz.currentQuestion].penalty + 's';
        } else {
            if (quiz.answers[quiz.currentQuestion].answer != quiz.questions[quiz.currentQuestion].correctAnswer) {
                this.penaltyBox.innerText = 'Penalty: ' + quiz.questions[quiz.currentQuestion].penalty + 's';
                this.penaltyBox.style.backgroundColor = this.wrongAnswerColor;
            } else {
                this.penaltyBox.innerText = 'No penalty';
                this.penaltyBox.style.backgroundColor = this.correctAnswerColor;
            }
        }

        this.updateButtons(quiz.questions, quiz.currentQuestion);

        this.addAnswersEventListener(quiz);
    }

    // Adds event listener to radio buttons in quiz.
    addAnswersEventListener(quiz: Quiz) {
        let answersRadio = document.getElementsByClassName('radio');

        for (let i = 0; i < answersRadio.length; ++i) {
            answersRadio[i].addEventListener('click', () => {
                if (quiz.answers[quiz.currentQuestion].answer == null) {
                    quiz.questionsAnsweredCount++;
                    if (quiz.questionsAnsweredCount == quiz.questions.length) {
                        this.finishButton.classList.remove('disabled_button');
                        this.finishButton.classList.add('button');
                    }
                }
                quiz.answers[quiz.currentQuestion].answer = parseInt((answersRadio[i] as HTMLElement).innerText);
            })
        }
    }

    updateButtons(questions: QuestionTuple[], currentQuestion: number) {
        if (currentQuestion == 0 && this.previousQuestionButton.classList.contains('button')) {
            this.previousQuestionButton.classList.remove('button');
            this.previousQuestionButton.classList.add('disabled_button');
        }

        if (currentQuestion == questions.length - 1 && this.nextQuestionButton.classList.contains('button')) {
            this.nextQuestionButton.classList.remove('button');
            this.nextQuestionButton.classList.add('disabled_button');
        }

        if (currentQuestion != 0 && currentQuestion != questions.length - 1) {
            if (this.previousQuestionButton.classList.contains('disabled_button')) {
                this.previousQuestionButton.classList.remove('disabled_button');
                this.previousQuestionButton.classList.add('button');
            }
            if (this.nextQuestionButton.classList.contains('disabled_button')) {
                this.nextQuestionButton.classList.remove('disabled_button');
                this.nextQuestionButton.classList.add('button');
            }
        }
    }
}

class Quiz {
    jsonQuestions: string;
    quizStats: QuizStats;
    htmlHandler: HtmlHandler;
    questions: QuestionTuple[];
    answers: Array<AnswerTuple>;
    currentQuestion: number;
    questionsAnsweredCount: number;
    startTime: number;
    lastSwapTime: number;
    score: number;
    quizTime: boolean;
    timer;

    constructor() {
        this.jsonQuestions = `[
          {
            "question": "2 + 3",
            "answers": [5, 6, 7, 8, 9],
            "correctAnswer": 5,
            "penalty": 4
          },
          {
            "question": "13 - 4",
            "answers": [5, 9, 8, 2],
            "correctAnswer": 9,
            "penalty": 10
          },
          {
            "question": "2 - (-24 : 4)",
            "answers": [8, 10, -8, -4],
            "correctAnswer": 8,
            "penalty": 7
          },
          {
            "question": "7 * 8",
            "answers": [48, 56, 63, 54],
            "correctAnswer": 56,
            "penalty": 100
          }
        ]`;
        this.questions = JSON.parse(this.jsonQuestions);
        this.answers = new Array<AnswerTuple>();
        this.quizStats = new QuizStats();
        this.htmlHandler = new HtmlHandler(this);
        this.quizStats.createLeaderboards();
        this.htmlHandler.getAnswersHTML(this.questions);
    }

    addQuestionTime() {
        let now = new Date().getTime();

        (this.answers)[this.currentQuestion].timeSpent += now - this.lastSwapTime;
        this.lastSwapTime = now;
    }

    startQuiz = () => {
        document.getElementById('start_view').style.display = 'none';
        document.getElementById('quiz_view').style.display = 'block';

        let start = new Date().getTime();

        this.startTime = start;
        this.quizTime = true;
        this.currentQuestion = 0;
        this.questionsAnsweredCount = 0;
        this.lastSwapTime = this.startTime;

        this.timer = setInterval(function () {
            let now = new Date().getTime();
            let hours = new Date(now - start).getUTCHours();
            let minutes = new Date(now - start).getUTCMinutes();
            let seconds = new Date(now - start).getUTCSeconds();

            let asTime = (x) => {
                return x < 10 ? 0 + String(x) : String(x);
            }

            document.getElementById('timer').innerText = (hours == 0 ? "" : asTime(hours) + ":") + asTime(minutes) + ":" + asTime(seconds);
        }, 1000);

        for (const question of this.questions) {
            this.answers.push(new AnswerTuple());
        }

        if (this.questions.length == 0) {
            this.htmlHandler.finishButton.classList.remove('disabled_button');
            this.htmlHandler.finishButton.classList.add('button');
            this.htmlHandler.nextQuestionButton.classList.remove('button');
            this.htmlHandler.nextQuestionButton.classList.add('disabled_button');
        } else {
            this.htmlHandler.displayQuestion(this);
        }
    }

    finishQuiz = () => {
        if (this.htmlHandler.finishButton.classList.contains('disabled_button')) return;

        if (this.questions.length > 0) {
            (document.getElementsByClassName('answer')[this.currentQuestion] as HTMLElement).style.display = 'none';
            this.addQuestionTime();
        }

        clearInterval(this.timer);

        this.quizTime = false;
        this.htmlHandler.penaltyBox.style.display = 'block';
        this.score = Math.floor((new Date().getTime() - this.startTime) / 1000);

        for (let i = 0; i < this.questions.length; i++) {
            if ((this.answers)[i].answer != (this.questions)[i].correctAnswer) {
                this.score += (this.questions)[i].penalty;
            }
        }

        document.getElementById('score').innerText = 'Your score: ' + this.score;

        let quizTimeElements = document.getElementsByClassName('quiz_time');
        let quizFinishedElements = document.getElementsByClassName('quiz_finished');
        let checkmarks = document.getElementsByClassName('checkmark');
        let radioButtons = document.getElementsByClassName('radio');

        for (let i = 0; i < quizTimeElements.length; i++) {
            (quizTimeElements[i] as HTMLElement).style.display = 'none';
        }

        for (let i = 0; i < quizFinishedElements.length; i++) {
            (quizFinishedElements[i] as HTMLElement).style.display = 'block';
        }

        for (let i = 0; i < checkmarks.length; i++) {
            (checkmarks[i] as HTMLElement).style.display = 'none';
            (radioButtons[i] as HTMLElement).style.cursor = 'default';
            (radioButtons[i] as HTMLElement).classList.remove('radio_active');
        }

        if (this.questions.length == 0) return;

        this.htmlHandler.nextQuestionButton.classList.remove('disabled_button');
        this.htmlHandler.nextQuestionButton.classList.add('button');

        // Setting wrong and correct answers.
        for (let i = 0; i < this.questions.length; i++) {
            let currentAnswers = document.getElementsByName('question' + i);

            for (let j = 0; j < currentAnswers.length; j++) {
                if ((currentAnswers[j] as HTMLInputElement).checked) {
                    currentAnswers[j].parentElement.style.backgroundColor = this.htmlHandler.wrongAnswerColor;
                }

                if (parseInt((currentAnswers[j] as HTMLInputElement).value) == (this.questions)[i].correctAnswer) {
                    currentAnswers[j].parentElement.style.backgroundColor = this.htmlHandler.correctAnswerColor;
                }
            }
        }

        this.currentQuestion = 0;

        this.htmlHandler.displayQuestion(this);
    }

    cancelQuiz = () => {
        document.getElementById('quiz_view').style.display = 'none';
        document.getElementById('cancel_view').style.display = 'block';

        clearInterval(this.timer);
    }

    previousQuestion = () => {
        if (this.htmlHandler.previousQuestionButton.classList.contains('disabled_button')) return;

        (document.getElementsByClassName('answer')[this.currentQuestion] as HTMLElement).style.display = 'none';

        if (this.quizTime) {
            this.addQuestionTime();
        }

        --this.currentQuestion;
        this.htmlHandler.displayQuestion(this);
    }

    nextQuestion = () => {
        if (this.htmlHandler.nextQuestionButton.classList.contains('disabled_button')) return;

        (document.getElementsByClassName('answer')[this.currentQuestion] as HTMLElement).style.display = 'none';

        if (this.quizTime) {
            this.addQuestionTime();
        }

        ++this.currentQuestion;
        this.htmlHandler.displayQuestion(this);
    }
}

new Quiz();
