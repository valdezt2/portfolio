// ===============================================
// BionIT Labs JSON-Driven Quiz Platform
// Supports:
// - multiple-choice
// - true-false
// - multiple-select
// - fill-in-the-blank
// - matching
// ===============================================

const moduleSelect = document.getElementById("moduleSelect");
const quizTitle = document.getElementById("quizTitle");
const quizForm = document.getElementById("quizForm");
const resultsDiv = document.getElementById("results");
const retakeBtn = document.getElementById("retakeBtn");
const submitBtn = document.getElementById("submitBtn");

let currentQuiz = null;

moduleSelect.addEventListener("change", handleQuizChange);
submitBtn.addEventListener("click", gradeQuiz);
retakeBtn.addEventListener("click", resetQuiz);

// Start with submit disabled until a quiz is selected
submitBtn.disabled = true;

function handleQuizChange() {
    const selectedFile = moduleSelect.value;

    clearQuizUI();

    if (!selectedFile) {
        quizTitle.textContent = "Select a Quiz Module";
        submitBtn.disabled = true;
        return;
    }

    quizTitle.textContent = "Loading Quiz...";

    fetch(selectedFile)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load ${selectedFile} (${response.status})`);
            }
            return response.json();
        })
        .then(data => {
            if (!data.questions || !Array.isArray(data.questions)) {
                throw new Error("Invalid quiz format: missing questions array.");
            }

            currentQuiz = data;
            renderQuiz(data);
            submitBtn.disabled = false;
        })
        .catch(error => {
            console.error("Error loading quiz:", error);
            currentQuiz = null;
            quizTitle.textContent = "Error Loading Quiz";
            quizForm.innerHTML = "";
            resultsDiv.innerHTML = `
                <p>Could not load the selected quiz file.</p>
                <p>${error.message}</p>
                <p>Make sure you are running this project from a local server, not by opening the HTML file directly.</p>
            `;
            submitBtn.disabled = true;
            retakeBtn.style.display = "none";
        });
}

function renderQuiz(quizData) {
    quizTitle.textContent = quizData.title || "Quiz";
    quizForm.innerHTML = "";
    resultsDiv.innerHTML = "";
    retakeBtn.style.display = "none";

    if (quizData.description) {
        const description = document.createElement("p");
        description.className = "quiz-description";
        description.textContent = quizData.description;
        quizForm.appendChild(description);
    }

    quizData.questions.forEach((question, index) => {
        const questionBlock = document.createElement("div");
        questionBlock.className = "question";
        questionBlock.id = `question-${index}`;

        const prompt = document.createElement("p");
        prompt.className = "question-title";
        prompt.textContent = `${index + 1}. ${question.prompt}`;
        questionBlock.appendChild(prompt);

        switch (question.type) {
            case "multiple-choice":
                renderMultipleChoice(questionBlock, question, index);
                break;

            case "true-false":
                renderTrueFalse(questionBlock, index);
                break;

            case "multiple-select":
                renderMultipleSelect(questionBlock, question, index);
                break;

            case "fill-in-the-blank":
                renderFillInBlank(questionBlock, index);
                break;

            case "matching":
                renderMatching(questionBlock, question, index);
                break;

            default: {
                const unsupported = document.createElement("p");
                unsupported.textContent = `Unsupported question type: ${question.type}`;
                questionBlock.appendChild(unsupported);
            }
        }

        quizForm.appendChild(questionBlock);
    });
}

function renderMultipleChoice(container, question, index) {
    question.options.forEach((option, optionIndex) => {
        const label = document.createElement("label");

        const input = document.createElement("input");
        input.type = "radio";
        input.name = `q-${index}`;
        input.value = optionIndex;

        label.appendChild(input);
        label.append(` ${option}`);
        container.appendChild(label);
    });
}

function renderTrueFalse(container, index) {
    ["True", "False"].forEach(value => {
        const label = document.createElement("label");

        const input = document.createElement("input");
        input.type = "radio";
        input.name = `q-${index}`;
        input.value = value.toLowerCase();

        label.appendChild(input);
        label.append(` ${value}`);
        container.appendChild(label);
    });
}

function renderMultipleSelect(container, question, index) {
    question.options.forEach((option, optionIndex) => {
        const label = document.createElement("label");

        const input = document.createElement("input");
        input.type = "checkbox";
        input.name = `q-${index}`;
        input.value = optionIndex;

        label.appendChild(input);
        label.append(` ${option}`);
        container.appendChild(label);
    });
}

function renderFillInBlank(container, index) {
    const input = document.createElement("input");
    input.type = "text";
    input.name = `q-${index}`;
    input.placeholder = "Type your answer here";
    input.className = "fill-blank-input";

    container.appendChild(input);
}

function renderMatching(container, question, index) {
    question.pairs.forEach((pair, pairIndex) => {
        const pairWrapper = document.createElement("div");
        pairWrapper.className = "match-pair";

        const leftText = document.createElement("span");
        leftText.textContent = pair.left;

        const select = document.createElement("select");
        select.name = `q-${index}-pair-${pairIndex}`;

        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "Select...";
        select.appendChild(defaultOption);

        question.choices.forEach(choice => {
            const option = document.createElement("option");
            option.value = choice;
            option.textContent = choice;
            select.appendChild(option);
        });

        pairWrapper.appendChild(leftText);
        pairWrapper.appendChild(select);
        container.appendChild(pairWrapper);
    });
}

function gradeQuiz() {
    if (!currentQuiz) return;

    let score = 0;
    const total = currentQuiz.questions.length;

    clearColoring();

    currentQuiz.questions.forEach((question, index) => {
        const questionBlock = document.getElementById(`question-${index}`);
        let isCorrect = false;

        switch (question.type) {
            case "multiple-choice":
                isCorrect = gradeMultipleChoice(question, index);
                break;

            case "true-false":
                isCorrect = gradeTrueFalse(question, index);
                break;

            case "multiple-select":
                isCorrect = gradeMultipleSelect(question, index);
                break;

            case "fill-in-the-blank":
                isCorrect = gradeFillInBlank(question, index);
                break;

            case "matching":
                isCorrect = gradeMatching(question, index);
                break;
        }

        if (isCorrect) {
            questionBlock.classList.add("correct");
            score++;
        } else {
            questionBlock.classList.add("incorrect");
        }
    });

    resultsDiv.innerHTML = `
        <h2>Your Score: ${score} / ${total}</h2>
        <p>${getFeedbackMessage(score, total)}</p>
    `;

    retakeBtn.style.display = "block";
    submitBtn.disabled = true;
}

function gradeMultipleChoice(question, index) {
    const selected = document.querySelector(`input[name="q-${index}"]:checked`);
    if (!selected) return false;
    return Number(selected.value) === question.answer;
}

function gradeTrueFalse(question, index) {
    const selected = document.querySelector(`input[name="q-${index}"]:checked`);
    if (!selected) return false;

    const userAnswer = selected.value === "true";
    return userAnswer === question.answer;
}

function gradeMultipleSelect(question, index) {
    const selected = document.querySelectorAll(`input[name="q-${index}"]:checked`);
    const selectedValues = Array.from(selected)
        .map(input => Number(input.value))
        .sort((a, b) => a - b);

    const correctAnswers = [...question.answer].sort((a, b) => a - b);

    return arraysEqual(selectedValues, correctAnswers);
}

function gradeFillInBlank(question, index) {
    const input = document.querySelector(`input[name="q-${index}"]`);
    if (!input) return false;

    const userAnswer = input.value.trim().toLowerCase();
    if (!userAnswer) return false;

    const acceptableAnswers = Array.isArray(question.answer)
        ? question.answer.map(answer => String(answer).trim().toLowerCase())
        : [String(question.answer).trim().toLowerCase()];

    return acceptableAnswers.includes(userAnswer);
}

function gradeMatching(question, index) {
    return question.pairs.every((pair, pairIndex) => {
        const select = document.querySelector(`select[name="q-${index}-pair-${pairIndex}"]`);
        return select && select.value === pair.right;
    });
}

function resetQuiz() {
    if (!currentQuiz) {
        resultsDiv.innerHTML = "";
        retakeBtn.style.display = "none";
        submitBtn.disabled = true;
        return;
    }

    quizForm.reset();
    resultsDiv.innerHTML = "";
    retakeBtn.style.display = "none";
    clearColoring();
    submitBtn.disabled = false;
}

function clearQuizUI() {
    currentQuiz = null;
    quizForm.innerHTML = "";
    resultsDiv.innerHTML = "";
    retakeBtn.style.display = "none";
    clearColoring();
}

function clearColoring() {
    const blocks = document.querySelectorAll(".question");
    blocks.forEach(block => {
        block.classList.remove("correct", "incorrect");
    });
}

function arraysEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    return arr1.every((value, index) => value === arr2[index]);
}

function getFeedbackMessage(score, total) {
    if (score === total) {
        return "Excellent work. You got every question correct.";
    }

    if (score >= Math.ceil(total * 0.8)) {
        return "Great job. You have a strong understanding of this module.";
    }

    if (score >= Math.ceil(total * 0.6)) {
        return "Good effort. Review a few areas and try again.";
    }

    return "Keep practicing and retake the quiz after reviewing the material.";
}