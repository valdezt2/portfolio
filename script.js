// ===============================================
//  BionIT Labs Demo Unit Quiz — Color Feedback JS
// ===============================================

// Correct answers for radio questions
const answerKey = {
    q1: "b",
    q2: "c",
    q3: "b",
    q4: "d",
    q5: "c",
    q6: "d",
    q7: "b",
    q9: "c",
    q10: "c"
};

// Correct answers for matching question (Q8)
const matchKey = {
    q8a: "close",
    q8b: "open",
    q8c: "ccw",
    q8d: "cw"
};

document.getElementById("submitBtn").addEventListener("click", gradeQuiz);
document.getElementById("retakeBtn").addEventListener("click", resetQuiz);

function gradeQuiz() {
    let score = 0;
    let total = 10;

    clearColoring(); // remove any previous highlights

    // Grade radio questions
    for (let q in answerKey) {
        const block = document.getElementById(`${q}-block`);
        const selected = document.querySelector(`input[name="${q}"]:checked`);

        if (!selected) {
            block.classList.add("incorrect");
            continue;
        }

        if (selected.value === answerKey[q]) {
            block.classList.add("correct");
            score++;
        } else {
            block.classList.add("incorrect");
        }
    }

    // Grade matching question (Q8)
    const q8block = document.getElementById("q8-block");
    let q8Correct = true;

    for (let q in matchKey) {
        const selected = document.querySelector(`select[name="${q}"]`);
        if (!selected || selected.value !== matchKey[q]) {
            q8Correct = false;
        }
    }

    if (q8Correct) {
        q8block.classList.add("correct");
        score++;
    } else {
        q8block.classList.add("incorrect");
    }

    // Display results
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = `
        <h2>Your Score: ${score} / ${total}</h2>
        <p>${score === total ? "Excellent! You mastered the Demo Unit." : "Review your answers and try again."}</p>
    `;

    // Show retake button
    document.getElementById("retakeBtn").style.display = "block";

    // Disable submit button
    document.getElementById("submitBtn").disabled = true;
}

function resetQuiz() {
    document.getElementById("quizForm").reset();
    document.getElementById("results").innerHTML = "";
    document.getElementById("submitBtn").disabled = false;
    document.getElementById("retakeBtn").style.display = "none";
    clearColoring();
}

function clearColoring() {
    const blocks = document.querySelectorAll(".question");
    blocks.forEach(block => {
        block.classList.remove("correct");
        block.classList.remove("incorrect");
    });
}