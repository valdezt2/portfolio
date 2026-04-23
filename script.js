const moduleSelect = document.getElementById("moduleSelect");
const quizTitle = document.getElementById("quizTitle");
const quizSubtitle = document.getElementById("quizSubtitle");
const quizForm = document.getElementById("quizForm");
const quizQuestions = document.getElementById("quizQuestions");
const resultsDiv = document.getElementById("results");
const retakeBtn = document.getElementById("retakeBtn");
const submitBtn = document.getElementById("submitBtn");

let currentQuiz = null;

moduleSelect.addEventListener("change", handleQuizChange);
quizForm.addEventListener("submit", handleSubmit);
retakeBtn.addEventListener("click", resetQuiz);

retakeBtn.style.display = "none";

async function handleQuizChange() {
    const selectedFile = moduleSelect.value;
    clearQuizUI();

    if (!selectedFile) {
        quizTitle.textContent = "Select a BionIT Labs Quiz Module";
        quizSubtitle.textContent = "Choose a quiz module below to load questions from a JSON file and test your knowledge.";
        submitBtn.disabled = true;
        return;
    }

    quizTitle.textContent = "Loading Quiz...";
    quizSubtitle.textContent = "Please wait while the quiz content is loaded.";
    submitBtn.disabled = true;

    try {
        const response = await fetch(selectedFile);

        if (!response.ok) {
            throw new Error(`Failed to load ${selectedFile} (${response.status})`);
        }

        const data = await response.json();

        if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
            throw new Error("Invalid quiz format: missing questions array.");
        }

        currentQuiz = data;
        renderQuiz(data);
        submitBtn.disabled = false;
    } catch (error) {
        console.error("Error loading quiz:", error);
        currentQuiz = null;
        quizTitle.textContent = "Error Loading Quiz";
        quizSubtitle.textContent = "The quiz file could not be loaded.";
        resultsDiv.innerHTML = `
            <p>Could not load the selected quiz file.</p>
            <p>${escapeHtml(error.message)}</p>
            <p>Run the project from a local server so the JSON files can be fetched correctly.</p>
        `;
    }
}

function renderQuiz(quizData) {
    quizTitle.textContent = quizData.title || "Quiz";
    quizSubtitle.textContent = quizData.description || "Answer every question before submitting.";
    quizQuestions.innerHTML = "";
    resultsDiv.innerHTML = "";
    retakeBtn.style.display = "none";

    quizData.questions.forEach((question, index) => {
        const questionBlock = document.createElement("section");
        questionBlock.className = "question";
        questionBlock.id = `question-${index}`;
        questionBlock.dataset.index = String(index);

        const title = document.createElement("h2");
        title.className = "question-title";
        title.textContent = `${index + 1}. ${question.prompt}`;
        questionBlock.appendChild(title);

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
            case "free-response":
                renderFreeResponse(questionBlock, question, index);
                break;
            case "matching":
                renderMatching(questionBlock, question, index);
                break;
            default: {
                const unsupported = document.createElement("p");
                unsupported.className = "unsupported-text";
                unsupported.textContent = `Unsupported question type: ${question.type}`;
                questionBlock.appendChild(unsupported);
            }
        }

        quizQuestions.appendChild(questionBlock);
    });
}

function renderMultipleChoice(container, question, index) {
    const optionsWrapper = document.createElement("div");
    optionsWrapper.className = "options-group";

    question.options.forEach((option, optionIndex) => {
        const label = document.createElement("label");

        const input = document.createElement("input");
        input.type = "radio";
        input.name = `q-${index}`;
        input.value = String(optionIndex);

        label.appendChild(input);
        label.append(` ${option}`);
        optionsWrapper.appendChild(label);
    });

    container.appendChild(optionsWrapper);
}

function renderTrueFalse(container, index) {
    const optionsWrapper = document.createElement("div");
    optionsWrapper.className = "options-group";

    ["True", "False"].forEach((value) => {
        const label = document.createElement("label");

        const input = document.createElement("input");
        input.type = "radio";
        input.name = `q-${index}`;
        input.value = value.toLowerCase();

        label.appendChild(input);
        label.append(` ${value}`);
        optionsWrapper.appendChild(label);
    });

    container.appendChild(optionsWrapper);
}

function renderMultipleSelect(container, question, index) {
    const optionsWrapper = document.createElement("div");
    optionsWrapper.className = "options-group";

    question.options.forEach((option, optionIndex) => {
        const label = document.createElement("label");

        const input = document.createElement("input");
        input.type = "checkbox";
        input.name = `q-${index}`;
        input.value = String(optionIndex);

        label.appendChild(input);
        label.append(` ${option}`);
        optionsWrapper.appendChild(label);
    });

    container.appendChild(optionsWrapper);
}

function renderFreeResponse(container, question, index) {
    const helper = document.createElement("p");
    helper.className = "free-response-help";
    helper.textContent = question.placeholder || "Write a short answer in your own words.";
    container.appendChild(helper);

    const input = document.createElement("textarea");
    input.name = `q-${index}`;
    input.className = "free-response-input";
    input.rows = 4;
    input.placeholder = question.placeholder || "Type your answer here";
    container.appendChild(input);
}

function renderMatching(container, question, index) {
    const matchesWrapper = document.createElement("div");
    matchesWrapper.className = "matching-group";

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
        matchesWrapper.appendChild(pairWrapper);
    });

    container.appendChild(matchesWrapper);
}

function handleSubmit(event) {
    event.preventDefault();

    if (!currentQuiz) {
        return;
    }

    clearQuestionStates();

    const unansweredQuestions = getUnansweredQuestions();

    if (unansweredQuestions.length > 0) {
        unansweredQuestions.forEach((questionIndex) => {
            const block = document.getElementById(`question-${questionIndex}`);
            if (block) {
                block.classList.add("missing");
            }
        });

        const firstMissingQuestion = unansweredQuestions[0] + 1;
        alert(`Please answer every question before submitting. Question ${firstMissingQuestion} still needs a response.`);
        document.getElementById(`question-${unansweredQuestions[0]}`)?.scrollIntoView({
            behavior: "smooth",
            block: "center",
        });
        return;
    }

    gradeQuiz();
}

function getUnansweredQuestions() {
    if (!currentQuiz) {
        return [];
    }

    const unanswered = [];

    currentQuiz.questions.forEach((question, index) => {
        if (!questionIsAnswered(question, index)) {
            unanswered.push(index);
        }
    });

    return unanswered;
}

function questionIsAnswered(question, index) {
    switch (question.type) {
        case "multiple-choice":
        case "true-false":
            return Boolean(document.querySelector(`input[name="q-${index}"]:checked`));
        case "multiple-select":
            return document.querySelectorAll(`input[name="q-${index}"]:checked`).length > 0;
        case "free-response": {
            const input = document.querySelector(`textarea[name="q-${index}"]`);
            return Boolean(input && input.value.trim());
        }
        case "matching":
            return question.pairs.every((_, pairIndex) => {
                const select = document.querySelector(`select[name="q-${index}-pair-${pairIndex}"]`);
                return Boolean(select && select.value);
            });
        default:
            return false;
    }
}

function gradeQuiz() {
    let score = 0;
    const total = currentQuiz.questions.length;

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
            case "free-response":
                isCorrect = gradeFreeResponse(question, index);
                break;
            case "matching":
                isCorrect = gradeMatching(question, index);
                break;
            default:
                isCorrect = false;
        }

        questionBlock.classList.remove("missing");
        questionBlock.classList.add(isCorrect ? "correct" : "incorrect");

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
}

function gradeMultipleChoice(question, index) {
    const selected = document.querySelector(`input[name="q-${index}"]:checked`);
    return Boolean(selected) && Number(selected.value) === question.answer;
}

function gradeTrueFalse(question, index) {
    const selected = document.querySelector(`input[name="q-${index}"]:checked`);

    if (!selected) {
        return false;
    }

    return (selected.value === "true") === question.answer;
}

function gradeMultipleSelect(question, index) {
    const selected = Array.from(document.querySelectorAll(`input[name="q-${index}"]:checked`))
        .map((input) => Number(input.value))
        .sort((a, b) => a - b);

    const answers = [...question.answer].sort((a, b) => a - b);

    return arraysEqual(selected, answers);
}

function gradeFreeResponse(question, index) {
    const input = document.querySelector(`textarea[name="q-${index}"]`);

    if (!input) {
        return false;
    }

    const userAnswer = normalizeText(input.value);
    const acceptableAnswers = (question.acceptableAnswers || []).map((answer) => normalizeText(answer));

    return acceptableAnswers.includes(userAnswer);
}

function gradeMatching(question, index) {
    return question.pairs.every((pair, pairIndex) => {
        const select = document.querySelector(`select[name="q-${index}-pair-${pairIndex}"]`);
        return Boolean(select) && select.value === pair.right;
    });
}

function resetQuiz() {
    if (!currentQuiz) {
        return;
    }

    quizForm.reset();
    resultsDiv.innerHTML = "";
    retakeBtn.style.display = "none";
    submitBtn.disabled = false;
    clearQuestionStates();
}

function clearQuizUI() {
    currentQuiz = null;
    quizQuestions.innerHTML = "";
    resultsDiv.innerHTML = "";
    retakeBtn.style.display = "none";
    clearQuestionStates();
}

function clearQuestionStates() {
    const blocks = document.querySelectorAll(".question");
    blocks.forEach((block) => {
        block.classList.remove("correct", "incorrect", "missing");
    });
}

function arraysEqual(first, second) {
    if (first.length !== second.length) {
        return false;
    }

    return first.every((value, index) => value === second[index]);
}

function normalizeText(value) {
    return String(value).trim().toLowerCase().replace(/\s+/g, " ");
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
    const div = document.createElement("div");
    div.textContent = value;
    return div.innerHTML;
}
