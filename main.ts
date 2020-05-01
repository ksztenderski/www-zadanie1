let jsonQuestions: string = `[
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

class ResultStorage {
    date: string;
    score: number;
    questionTimes: number[];

    constructor(date: string, score: number, questionTimes: number[]) {
        this.date = date;
        this.score = score;
        this.questionTimes = questionTimes;
    }
}

let storedResults: Array<ResultStorage> = localStorage.getItem('quizResults') != null ?
    JSON.parse(localStorage.getItem('quizResults')) : new Array<ResultStorage>();
let questions: QuestionTuple[] = JSON.parse(jsonQuestions);
let answers = new Array<AnswerTuple>();
let currentQuestion, questionsAnsweredCount, startTime, lastSwapTime, score: number;
let quizTime: boolean;
let answersHTML = new Array<string>();
let timer;
let correctAnswerColor = '#21bf73';
let wrongAnswerColor = '#fd5e53';

let topScores = document.getElementById('top_scores');
let penaltyBox = document.getElementById('penalty');
let startButton = document.getElementById('start_button');
let finishButton = document.getElementById('finish_button');
let cancelButton = document.getElementById('cancel_button');
let restartButton = document.getElementById('restart_button');
let nextQuestionButton = document.getElementById('next_question_button');
let previousQuestionButton = document.getElementById('previous_question_button');
let saveResultsWithStatsButton = document.getElementById('save_results_with_stats_button');
let saveResultsWithoutStatsButton = document.getElementById('save_results_without_stats_button');

// Shuffles given array.
function shuffle(array: number[]) {
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
for (let i = 0; i < questions.length; i++) {
    let question = questions[i];
    let currentAnswersHTML = new Array<string>();

    let shuffledAnswers = question.answers;

    shuffle(shuffledAnswers);

    for (const answer of shuffledAnswers) {
        currentAnswersHTML.push(
            `<label class="radio radio_active">${answer}
                <input type="radio" name="question${i}" value="${answer}">
                <span class="checkmark"></span>
            </label>`);
    }

    answersHTML.push(
        '<div class="answer">' + currentAnswersHTML.join('') + '</div>'
    );


}

document.getElementById('answers').innerHTML = answersHTML.join('');

// Sets top scores table.
if (storedResults.length > 0) {
    let topScoresHTML = new Array<string>();

    topScoresHTML.push(
        '<tr><th colspan="2">Top Scores</th></tr><tr><th>When</th> <th>Score</th> </tr>'
    );

    for (let i = 0; i < Math.min(storedResults.length, 5); i++) {
        let storedResult = storedResults[i];
        topScoresHTML.push(
            `<tr>
            <td>${storedResult.date}</td>
            <td>${storedResult.score}</td>
        </tr>`
        )
    }

    topScores.innerHTML = topScoresHTML.join('');
}

startButton.addEventListener('click', startQuiz);
finishButton.addEventListener('click', finishQuiz);
cancelButton.addEventListener('click', cancelQuiz);
restartButton.addEventListener('click', () => location.reload());
nextQuestionButton.addEventListener('click', nextQuestion);
previousQuestionButton.addEventListener('click', previousQuestion);
saveResultsWithStatsButton.addEventListener('click', saveResultsWithStats);
saveResultsWithoutStatsButton.addEventListener('click', () => saveResults(null));

function displayQuestion() {
    document.getElementById('question_number').innerText = (currentQuestion + 1) + ' / ' + questions.length;
    document.getElementById('question').innerText = questions[currentQuestion].question;
    (document.getElementsByClassName('answer')[currentQuestion] as HTMLElement).style.display = 'block';

    if (quizTime) {
        penaltyBox.innerText = 'Penalty: ' + questions[currentQuestion].penalty + 's';
    } else {
        if (answers[currentQuestion].answer != questions[currentQuestion].correctAnswer) {
            penaltyBox.innerText = 'Penalty: ' + questions[currentQuestion].penalty + 's';
            penaltyBox.style.backgroundColor = wrongAnswerColor;
        } else {
            penaltyBox.innerText = 'No penalty';
            penaltyBox.style.backgroundColor = correctAnswerColor;
        }
    }

    updateButtons();

    addAnswersEventListener();
}

function addQuestionTime() {
    let now = new Date().getTime();

    answers[currentQuestion].timeSpent += now - lastSwapTime;
    lastSwapTime = now;
}

// Adds event listener to radio buttons in quiz.
function addAnswersEventListener() {
    let answersRadio = document.getElementsByClassName('radio');

    for (let i = 0; i < answersRadio.length; ++i) {
        answersRadio[i].addEventListener('click', () => {
            if (answers[currentQuestion].answer == null) {
                questionsAnsweredCount++;
                if (questionsAnsweredCount == questions.length) {
                    finishButton.classList.remove('disabled_button');
                    finishButton.classList.add('button');
                }
            }
            answers[currentQuestion].answer = parseInt((answersRadio[i] as HTMLElement).innerText);
        })
    }
}

function startQuiz() {
    document.getElementById('start_view').style.display = 'none';
    document.getElementById('quiz_view').style.display = 'block';

    startTime = new Date().getTime();

    quizTime = true;
    currentQuestion = 0;
    questionsAnsweredCount = 0;
    lastSwapTime = startTime;

    timer = setInterval(function () {
        let now = new Date().getTime();
        let distance = now - startTime;
        let hours = Math.floor(distance / (1000 * 60 * 60));
        let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        let seconds = Math.floor((distance % (1000 * 60)) / 1000);

        let asTime = (x) => {
            return x < 10 ? 0 + String(x) : String(x);
        }

        document.getElementById('timer').innerText = (hours == 0 ? "" : asTime(hours) + ":") + asTime(minutes) + ":" + asTime(seconds);
    }, 1000);

    for (const question of questions) {
        answers.push(new AnswerTuple());
    }

    if (questions.length == 0) {
        finishButton.classList.remove('disabled_button');
        finishButton.classList.add('button');
        nextQuestionButton.classList.remove('button');
        nextQuestionButton.classList.add('disabled_button');
    } else {
        displayQuestion();
    }
}

function finishQuiz() {
    if (finishButton.classList.contains('disabled_button')) return;

    if (questions.length > 0) {
        (document.getElementsByClassName('answer')[currentQuestion] as HTMLElement).style.display = 'none';
        addQuestionTime();
    }

    clearInterval(timer);

    quizTime = false;
    penaltyBox.style.display = 'block';
    score = Math.floor((new Date().getTime() - startTime) / 1000);

    for (let i = 0; i < questions.length; i++) {
        if (answers[i].answer != questions[i].correctAnswer) {
            score += questions[i].penalty;
        }
    }

    document.getElementById('score').innerText = 'Your score: ' + score;

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

    if (questions.length == 0) return;

    nextQuestionButton.classList.remove('disabled_button');
    nextQuestionButton.classList.add('button');

    // Setting wrong and correct answers.
    for (let i = 0; i < questions.length; i++) {
        let currentAnswers = document.getElementsByName('question' + i);

        for (let j = 0; j < currentAnswers.length; j++) {
            if ((currentAnswers[j] as HTMLInputElement).checked) {
                currentAnswers[j].parentElement.style.backgroundColor = wrongAnswerColor;
            }

            if (parseInt((currentAnswers[j] as HTMLInputElement).value) == questions[i].correctAnswer) {
                currentAnswers[j].parentElement.style.backgroundColor = correctAnswerColor;
            }
        }
    }

    currentQuestion = 0;

    displayQuestion();
}

function cancelQuiz() {
    document.getElementById('quiz_view').style.display = 'none';
    document.getElementById('cancel_view').style.display = 'block';

    clearInterval(timer);
}

function updateButtons() {
    if (currentQuestion == 0 && previousQuestionButton.classList.contains('button')) {
        previousQuestionButton.classList.remove('button');
        previousQuestionButton.classList.add('disabled_button');
    }

    if (currentQuestion == questions.length - 1 && nextQuestionButton.classList.contains('button')) {
        nextQuestionButton.classList.remove('button');
        nextQuestionButton.classList.add('disabled_button');
    }

    if (currentQuestion != 0 && currentQuestion != questions.length - 1) {
        if (previousQuestionButton.classList.contains('disabled_button')) {
            previousQuestionButton.classList.remove('disabled_button');
            previousQuestionButton.classList.add('button');
        }
        if (nextQuestionButton.classList.contains('disabled_button')) {
            nextQuestionButton.classList.remove('disabled_button');
            nextQuestionButton.classList.add('button');
        }
    }
}

function previousQuestion() {
    if (previousQuestionButton.classList.contains('disabled_button')) return;

    (document.getElementsByClassName('answer')[currentQuestion] as HTMLElement).style.display = 'none';

    if (quizTime) {
        addQuestionTime();
    }

    --currentQuestion;
    displayQuestion();
}

function nextQuestion() {
    if (nextQuestionButton.classList.contains('disabled_button')) return;

    (document.getElementsByClassName('answer')[currentQuestion] as HTMLElement).style.display = 'none';

    if (quizTime) {
        addQuestionTime();
    }

    ++currentQuestion;
    displayQuestion();
}

function saveResults(questionTimes: number[]) {
    let now = new Date();
    let when = now.toDateString() + ' ' + now.toTimeString().substr(0, now.toTimeString().indexOf(' '))
    storedResults.push(new ResultStorage(when, score, questionTimes));
    storedResults.sort((a, b) => a.score - b.score);
    localStorage.setItem('quizResults', JSON.stringify(storedResults));

    location.reload();
}

function saveResultsWithStats() {
    let questionTimes = new Array<number>();

    for (const answer of answers) {
        questionTimes.push(answer.answer);
    }

    saveResults(questionTimes);
}
