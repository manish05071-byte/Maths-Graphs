window.onload = function() {

const graphDiv = document.getElementById('graph');
const functionInput = document.getElementById('functionInput');
const functionInput2 = document.getElementById('functionInput2');
const plotBtn = document.getElementById('plotBtn');
const mcqDiv = document.getElementById('mcqDiv');

const xVals = Array.from({length:201}, (_, i) => -10 + i*0.1);

// ---- Parse math safely ----
function parseMath(expr) {
    let jsExpr = expr.replace(/\^/g, "**");
    jsExpr = jsExpr.replace(/(\d)([a-zA-Z\(])/g, "$1*$2"); // 2x -> 2*x

    // Trig
    jsExpr = jsExpr.replace(/sin\(/g, "Math.sin(");
    jsExpr = jsExpr.replace(/cos\(/g, "Math.cos(");
    jsExpr = jsExpr.replace(/tan\(/g, "Math.tan(");
    jsExpr = jsExpr.replace(/csc\(/g, "1/Math.sin(");
    jsExpr = jsExpr.replace(/sec\(/g, "1/Math.cos(");
    jsExpr = jsExpr.replace(/cot\(/g, "1/Math.tan(");

    // Other functions
    jsExpr = jsExpr.replace(/log\(/g, "Math.log(");
    jsExpr = jsExpr.replace(/sqrt\(/g, "Math.sqrt(");
    jsExpr = jsExpr.replace(/\|x\|/g, "Math.abs(x)");
    jsExpr = jsExpr.replace(/\|([-+]*[0-9x\*\.\+\-\(\)]+)\|/g, "Math.abs($1)");
    jsExpr = jsExpr.replace(/exp\(/g, "Math.exp(");
    jsExpr = jsExpr.replace(/e\*\*([0-9x\+\-\*\/\(\)\.]+)/g, "Math.exp($1)");
    jsExpr = jsExpr.replace(/e\^([0-9x\+\-\*\/\(\)\.]+)/g, "Math.exp($1)");

    return jsExpr;
}

// ---- Evaluate y values safely ----
function evalY(expr) {
    const jsExpr = parseMath(expr);
    const y = [];
    for (let i = 0; i < xVals.length; i++) {
        let x = xVals[i];
        try {
            let val = eval(jsExpr);
            if (isNaN(val) || !isFinite(val)) val = null;
            y.push(val);
        } catch(e) {
            y.push(null);
        }
    }
    return y;
}

// ---- Plot graph ----
function plotGraph(traces) {
    Plotly.newPlot(graphDiv, traces, {title:'Graph', xaxis:{title:'x'}, yaxis:{title:'y'}});
}

// ---- Detect function type ----
function detectType(expr) {
    expr = expr.toLowerCase();
    if(expr.includes("sin") || expr.includes("cos") || expr.includes("tan") ||
       expr.includes("csc") || expr.includes("sec") || expr.includes("cot")) return "trig";
    if(expr.includes("x**2") || expr.includes("^2")) return "parabola";
    return "line";
}

// ---- Generate MCQs ----
function generateMCQs(expr, type){
    const mcqs = [];
    if(type==="line"){
        const match = expr.match(/([-+]?\d*\.?\d*)\*?x\s*([-+]\s*\d+)?/);
        const m = match && match[1]!="" ? parseFloat(match[1]) : 1;
        const c = match && match[2]? parseFloat(match[2].replace(/\s+/g,"")):0;
        mcqs.push({q:`Slope of ${expr}?`, options:[m, m+1, m-1, -m].map(String), ans:String(m)});
        mcqs.push({q:`y-intercept of ${expr}?`, options:[c,c+1,c-1,-c].map(String), ans:String(c)});
        mcqs.push({q:`Slope of line perpendicular to ${expr}?`, options:[-1/m,m,-m,1/m].map(String), ans:String(-1/m)});
    } else if(type==="parabola"){
        const match = expr.match(/([-+]?\d*\.?\d*)\*?x\*\*2\s*([-+]\s*\d*\.?\d*)\*?x\s*([-+]\s*\d+)?/);
        const a = match && match[1]!="" ? parseFloat(match[1]):1;
        const b = match && match[2]? parseFloat(match[2].replace(/\s+/g,"")):0;
        const c = match && match[3]? parseFloat(match[3].replace(/\s+/g,"")):0;
        const vx = -b/(2*a);
        const vy = a*vx*vx + b*vx + c;
        mcqs.push({q:`Vertex of ${expr}?`, options:[`(${vx.toFixed(2)},${vy.toFixed(2)})`,`(0,0)`,`(${vx.toFixed(2)},0)`,`(${vy.toFixed(2)},${vx.toFixed(2)})`], ans:`(${vx.toFixed(2)},${vy.toFixed(2)})`});
        mcqs.push({q:`Axis of symmetry of ${expr}?`, options:[`x=${vx.toFixed(2)}`,"y=0","x=0","y="+vy.toFixed(2)], ans:`x=${vx.toFixed(2)}`});
        const disc = b*b - 4*a*c;
        if(disc>=0){
            const r1 = (-b+Math.sqrt(disc))/(2*a);
            const r2 = (-b-Math.sqrt(disc))/(2*a);
            mcqs.push({q:`Roots of ${expr}?`, options:[`${r1.toFixed(2)},${r2.toFixed(2)}`, "0,0", `${r1.toFixed(2)},0`,`-1,1`], ans:`${r1.toFixed(2)},${r2.toFixed(2)}`});
        }
    } else if(type==="trig"){
        const amplitudeMatch = expr.match(/([-+]?\d*\.?\d*)?\*?(sin|cos|tan|csc|sec|cot)/);
        const amplitude = amplitudeMatch && amplitudeMatch[1]!="" ? parseFloat(amplitudeMatch[1]):1;
        const periodMatch = expr.match(/\(([-+]?\d*\.?\d*)x/);
        const periodCoeff = periodMatch && periodMatch[1]!="" ? parseFloat(periodMatch[1]):1;
        const period = (2*Math.PI)/periodCoeff;
        mcqs.push({q:`Amplitude of ${expr}?`, options:[amplitude, amplitude+1, -amplitude, 0].map(String), ans:String(amplitude)});
        mcqs.push({q:`Period of ${expr}?`, options:[period.toFixed(2), (period/2).toFixed(2), (period*2).toFixed(2), "1"], ans:period.toFixed(2)});
    }
    return mcqs;
}

// ---- Intersection ----
function intersectionQ(y1, y2){
    const inter=[];
    for(let i=0;i<xVals.length;i++){
        if(y1[i]!==null && y2[i]!==null && Math.abs(y1[i]-y2[i])<0.05) inter.push(xVals[i].toFixed(2));
    }
    return {q:"Intersection x-value(s) of Graph1 & Graph2?", options:[inter.join(", ") || "No intersection","0","1","-1"], ans: inter.join(", ") || "No intersection"};
}

// ---- Render MCQs ----
function renderMCQs(mcqs, inter=null){
    let html = `<h2>MCQs</h2>`;
    mcqs.forEach((mcq,i)=>{
        html += `<div style="margin-bottom:10px;"><b>Q${i+1}: ${mcq.q}</b><br>`;
        mcq.options.forEach(opt=> html += `<input type="radio" name="q${i}" value="${opt}"> ${opt} &nbsp;`);
        html += `</div>`;
    });
    if(inter){
        html += `<div style="margin-bottom:10px;"><b>Intersection Q: ${inter.q}</b><br>`;
        inter.options.forEach(opt=> html += `<input type="radio" name="intersection" value="${opt}"> ${opt} &nbsp;`);
        html += `</div>`;
    }
    html += `<button id="checkBtn">Check Answers</button>`;
    mcqDiv.innerHTML = html;

    document.getElementById('checkBtn').addEventListener('click',()=>{
        mcqs.forEach((mcq,i)=>{
            const radios = document.getElementsByName(`q${i}`);
            radios.forEach(r=>{
                if(r.checked){
                    r.parentElement.style.background = (r.value===mcq.ans)?'lightgreen':'salmon';
                    if(r.value!==mcq.ans) r.parentElement.innerHTML += ` <span style="color:green;">Correct: ${mcq.ans}</span>`;
                }
            });
        });
        if(inter){
            const radios = document.getElementsByName('intersection');
            radios.forEach(r=>{
                if(r.checked){
                    r.parentElement.style.background = (r.value===inter.ans)?'lightgreen':'salmon';
                    if(r.value!==inter.ans) r.parentElement.innerHTML += ` <span style="color:green;">Correct: ${inter.ans}</span>`;
                }
            });
        }
    });
}

// ---- Plot button ----
plotBtn.addEventListener('click',()=>{
    const expr1 = functionInput.value.trim();
    const expr2 = functionInput2.value.trim();
    if(expr1==="") return alert("Enter at least Graph 1");

    const y1 = evalY(expr1);
    const traces = [{x:xVals, y:y1, mode:'lines', line:{color:'blue'}, name:'Graph 1'}];

    let inter = null;
    if(expr2!==""){
        const y2 = evalY(expr2);
        traces.push({x:xVals, y:y2, mode:'lines', line:{color:'red'}, name:'Graph 2', connectgaps:false});
        inter = intersectionQ(y1, y2);
    }

    plotGraph(traces);
    const type = detectType(expr1);
    const mcqs = generateMCQs(expr1, type);
    renderMCQs(mcqs, inter);
});

};
