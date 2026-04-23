// /script.js

const moduleSelect = document.getElementById("moduleSelect");
const quizTitle = document.getElementById("quizTitle");
const quizSubtitle = document.getElementById("quizSubtitle");
const quizForm = document.getElementById("quizForm");
const quizQuestions = document.getElementById("quizQuestions");
const resultsDiv = document.getElementById("results");
const retakeBtn = document.getElementById("retakeBtn");
const submitBtn = document.getElementById("submitBtn");

const defaultTitle = "Select a BionIT Labs Quiz Module";
const defaultSubtitle =
    "Choose a quiz module below to load questions from a JSON file and test your knowledge.";

let currentQuiz = null;

initializeQuizApp();

function initializeQuizApp() {
    if (
        !moduleSelect ||
        !quizTitle ||
        !quizSubtitle ||
        !quizForm ||
        !quizQuestions ||
        !resultsDiv ||
        !retakeBtn ||
        !submitBtn
    ) {
        console.error("Quiz app could not start because required HTML elements are missing.");
        return;
    }

    submitBtn.disabled = true;
    retakeBtn.style.display = "none";

    moduleSelect.addEventListener("change", handleQuizChange);
    quizForm.addEventListener("submit", handleQuizSubmit);
    retakeBtn.addEventListener("click", resetQuiz);
}

async function handleQuizChange() {
    const selectedFile = moduleSelect.value;

    clearQuizUI();

    if (!selectedFile) {
        setQuizHeader(defaultTitle, defaultSubtitle);
        submitBtn.disabled = true;
        return;
    }

    setQuizHeader("Loading Quiz...", "Please wait while the quiz is being loaded.");

    try {
        const response = await fetch(selectedFile);

        if (!response.ok) {
            throw new Error(`Failed to load ${selectedFile} (${response.status})`);
        }

        const quizData = await response.json();

        if (!quizData || !Array.isArray(quizData.questions) || quizData.questions.length === 0) {
            throw new Error("Invalid quiz format: missing or empty questions array.");
        }

        currentQuiz = quizData;
        renderQuiz(quizData);
        submitBtn.disabled = false;
    } catch (error) {
        console.error("Error loading quiz:", error);
        currentQuiz = null;
        setQuizHeader("Error Loading Quiz", "The quiz file could not be loaded.");

        resultsDiv.innerHTML = `
            <p>Sorry, the selected quiz could not be opened.</p>
            <p>${escapeHtml(error.message)}</p>
            <p>Run this project from a local server or GitHub Pages so the JSON files can load correctly.</p>
        `;

        submitBtn.disabled = true;
        retakeBtn.style.display = "none";
    }
}

function handleQuizSubmit(event) {
    event.preventDefault();

    if (!currentQuiz) {
        return;
    }

    const unansweredQuestions = getUnansweredQuestions();

    if (unansweredQuestions.length > 0) {
        alert(buildIncompleteQuizMessage(unansweredQuestions));
        focusFirstUnansweredQuestion(unansweredQuestions[0] - 1);
        return;
    }

    gradeQuiz();
}

function renderQuiz(quizData) {
    setQuizHeader(quizData.title || "Quiz", quizData.description || defaultSubtitle);

    quizQuestions.innerHTML = "";
    resultsDiv.innerHTML = "";
    retakeBtn.style.display = "none";

    quizData.questions.forEach((question, index) => {
        const questionBlock = document.createElement("section");
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
                renderFillInTheBlank(questionBlock, index);
                break;

            case "free-response":
                renderFreeResponse(questionBlock, index);
                break;

            case "matching":
                renderMatching(questionBlock, question, index);
                break;

            default:
                renderUnsupportedQuestion(questionBlock, question.type);
                break;
        }

        quizQuestions.appendChild(questionBlock);
    });
}

function renderMultipleChoice(container, question, index) {
    if (!Array.isArray(question.options)) {
        renderUnsupportedQuestion(container, "multiple-choice");
        return;
    }

    question.options.forEach((option, optionIndex) => {
        const label = document.createElement("label");

        const input = document.createElement("input");
        input.type = "radio";
        input.name = `q-${index}`;
        input.value = String(optionIndex);

        const text = document.createTextNode(option);

        label.appendChild(input);
        label.appendChild(text);
        container.appendChild(label);
    });
}

function renderTrueFalse(container, index) {
    ["True", "False"].forEach((value) => {
        const label = document.createElement("label");

        const input = document.createElement("input");
        input.type = "radio";
        input.name = `q-${index}`;
        input.value = value.toLowerCase();

        const text = document.createTextNode(value);

        label.appendChild(input);
        label.appendChild(text);
        container.appendChild(label);
    });
}

function renderMultipleSelect(container, question, index) {
    if (!Array.isArray(question.options)) {
        renderUnsupportedQuestion(container, "multiple-select");
        return;
    }

    question.options.forEach((option, optionIndex) => {
        const label = document.createElement("label");

        const input = document.createElement("input");
        input.type = "checkbox";
        input.name = `q-${index}`;
        input.value = String(optionIndex);

        const text = document.createTextNode(option);

        label.appendChild(input);
        label.appendChild(text);
        container.appendChild(label);
    });
}

function renderFillInTheBlank(container, index) {
    const input = document.createElement("input");
    input.type = "text";
    input.name = `q-${index}`;
    input.className = "fill-blank-input";
    input.placeholder = "Type your answer here";

    container.appendChild(input);
}

function renderFreeResponse(container, index) {
    const textarea = document.createElement("textarea");
    textarea.name = `q-${index}`;
    textarea.className = "free-response-input";
    textarea.rows = 5;
    textarea.placeholder = "Type your response here";

    container.appendChild(textarea);
}

function renderMatching(container, question, index) {
    if (!Array.isArray(question.pairs) || !Array.isArray(question.choices)) {
        renderUnsupportedQuestion(container, "matching");
        return;
    }

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

        question.choices.forEach((choice) => {
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

function renderUnsupportedQuestion(container, type) {
    const message = document.createElement("p");
    message.textContent = `Unsupported question type: ${type || "unknown"}`;
    container.appendChild(message);
}

function getUnansweredQuestions() {
    if (!currentQuiz) {
        return [];
    }

    const unanswered = [];

    currentQuiz.questions.forEach((question, index) => {
        if (!isQuestionAnswered(question, index)) {
            unanswered.push(index + 1);
        }
    });

    return unanswered;
}

function isQuestionAnswered(question, index) {
    switch (question.type) {
        case "multiple-choice":
        case "true-false":
            return Boolean(document.querySelector(`input[name="q-${index}"]:checked`));

        case "multiple-select":
            return document.querySelectorAll(`input[name="q-${index}"]:checked`).length > 0;

        case "fill-in-the-blank":
        case "free-response": {
            const input = document.querySelector(`[name="q-${index}"]`);
            return Boolean(input && input.value.trim());
        }

        case "matching":
            return question.pairs.every((_, pairIndex) => {
                const select = document.querySelector(`select[name="q-${index}-pair-${pairIndex}"]`);
                return Boolean(select && select.value.trim());
            });

        default:
            return false;
    }
}

function buildIncompleteQuizMessage(unansweredQuestions) {
    const questionLabel =
        unansweredQuestions.length === 1 ? "question" : "questions";

    return `Please answer all questions before submitting.\n\nYou still need to complete ${questionLabel}: ${unansweredQuestions.join(", ")}.`;
}

function focusFirstUnansweredQuestion(index) {
    const questionBlock = document.getElementById(`question-${index}`);

    if (!questionBlock) {
        return;
    }

    const firstField = questionBlock.querySelector("input, textarea, select");

    if (firstField) {
        firstField.focus();
    }
}

function gradeQuiz() {
    let score = 0;
    const total = currentQuiz.questions.length;

    clearColoring();

    currentQuiz.questions.forEach((question, index) => {
        const questionBlock = document.getElementById(`question-${index}`);
        const isCorrect = gradeQuestion(question, index);

        if (questionBlock) {
            questionBlock.classList.add(isCorrect ? "correct" : "incorrect");
        }

        if (isCorrect) {
            score += 1;
        }
    });

    resultsDiv.innerHTML = `
        <h2>Your Score: ${score} / ${total}</h2>
        <p>${getFeedbackMessage(score, total)}</p>
    `;

    submitBtn.disabled = true;
    retakeBtn.style.display = "block";
    resultsDiv.scrollIntoView({ behavior: "smooth", block: "start" });
}

function gradeQuestion(question, index) {
    switch (question.type) {
        case "multiple-choice":
            return gradeMultipleChoice(question, index);

        case "true-false":
            return gradeTrueFalse(question, index);

        case "multiple-select":
            return gradeMultipleSelect(question, index);

        case "fill-in-the-blank":
        case "free-response":
            return gradeTextResponse(question, index);

        case "matching":
            return gradeMatching(question, index);

        default:
            return false;
    }
}

function gradeMultipleChoice(question, index) {
    const selected = document.querySelector(`input[name="q-${index}"]:checked`);

    if (!selected) {
        return false;
    }

    return Number(selected.value) === Number(question.answer);
}

function gradeTrueFalse(question, index) {
    const selected = document.querySelector(`input[name="q-${index}"]:checked`);

    if (!selected) {
        return false;
    }

    const userAnswer = selected.value === "true";
    return userAnswer === Boolean(question.answer);
}

function gradeMultipleSelect(question, index) {
    const selected = Array.from(
        document.querySelectorAll(`input[name="q-${index}"]:checked`)
    )
        .map((input) => Number(input.value))
        .sort((a, b) => a - b);

    const correctAnswers = Array.isArray(question.answer)
        ? [...question.answer].map(Number).sort((a, b) => a - b)
        : [];

    return arraysEqual(selected, correctAnswers);
}

function gradeTextResponse(question, index) {
    const input = document.querySelector(`[name="q-${index}"]`);

    if (!input) {
        return false;
    }

    const userAnswer = normalizeText(input.value);

    if (!userAnswer) {
        return false;
    }

    const acceptableAnswers = getAcceptableAnswers(question);

    if (acceptableAnswers.length > 0) {
        return acceptableAnswers.includes(userAnswer);
    }

    if (Array.isArray(question.keywords) && question.keywords.length > 0) {
        return question.keywords.every((keyword) =>
            userAnswer.includes(normalizeText(keyword))
        );
    }

    return false;
}

function gradeMatching(question, index) {
    return question.pairs.every((pair, pairIndex) => {
        const select = document.querySelector(`select[name="q-${index}-pair-${pairIndex}"]`);

        if (!select) {
            return false;
        }

        return normalizeText(select.value) === normalizeText(pair.right);
    });
}

function getAcceptableAnswers(question) {
    if (Array.isArray(question.answer)) {
        return question.answer.map((answer) => normalizeText(String(answer)));
    }

    if (typeof question.answer === "string" || typeof question.answer === "number") {
        return [normalizeText(String(question.answer))];
    }

    return [];
}

function normalizeText(value) {
    return String(value)
        .toLowerCase()
        .trim()
        .replace(/[^\w\s]/g, "")
        .replace(/\s+/g, " ");
}

function resetQuiz() {
    if (!currentQuiz) {
        clearQuizUI();
        setQuizHeader(defaultTitle, defaultSubtitle);
        submitBtn.disabled = true;
        return;
    }

    quizForm.reset();
    resultsDiv.innerHTML = "";
    retakeBtn.style.display = "none";
    submitBtn.disabled = false;
    clearColoring();

    const firstField = quizQuestions.querySelector("input, textarea, select");
    if (firstField) {
        firstField.focus();
    }
}

function clearQuizUI() {
    currentQuiz = null;
    quizQuestions.innerHTML = "";
    resultsDiv.innerHTML = "";
    retakeBtn.style.display = "none";
    clearColoring();
}

function clearColoring() {
    const blocks = document.querySelectorAll(".question");

    blocks.forEach((block) => {
        block.classList.remove("correct", "incorrect");
    });
}

function arraysEqual(first, second) {
    if (first.length !== second.length) {
        return false;
    }

    return first.every((value, index) => value === second[index]);
}

function setQuizHeader(title, subtitle) {
    quizTitle.textContent = title;
    quizSubtitle.textContent = subtitle;
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

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}
