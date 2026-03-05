// === Navigation ===

function showView(id) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Task-Cards: Klick öffnet die jeweilige Aufgabe
document.querySelectorAll('.task-card').forEach(card => {
    card.addEventListener('click', () => {
        const task = card.dataset.task;
        showView('task-' + task);
    });
});

// Zurück-Buttons
document.querySelectorAll('[data-back]').forEach(btn => {
    btn.addEventListener('click', () => showView('overview'));
});

// === Toggle-Buttons (statt Dropdowns) ===

document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const group = btn.dataset.group;
        const target = btn.dataset.toggle;

        // Buttons in derselben Gruppe umschalten
        btn.closest('.toggle-row').querySelectorAll('.toggle-btn').forEach(b => {
            b.classList.remove('active');
        });
        btn.classList.add('active');

        // Zugehörige Eingabefelder umschalten
        const parent = btn.closest('.task-input');
        if (group === 'querschnitt') {
            parent.querySelector('#inputs-rechteck').classList.toggle('hidden', target !== 'rechteck');
            parent.querySelector('#inputs-kreis').classList.toggle('hidden', target !== 'kreis');
        } else if (group === 'lastfall') {
            parent.querySelector('#inputs-gleichlast').classList.toggle('hidden', target !== 'gleichlast');
            parent.querySelector('#inputs-einzellast').classList.toggle('hidden', target !== 'einzellast');
        }
    });
});

// === Hilfsfunktionen ===

function fmt(value, unit, decimals) {
    if (decimals === undefined) decimals = 2;
    // Große/kleine Zahlen in Exponentialschreibweise
    if (Math.abs(value) >= 1e6 || (Math.abs(value) < 0.01 && value !== 0)) {
        return value.toExponential(decimals) + ' ' + unit;
    }
    return value.toFixed(decimals) + ' ' + unit;
}

function renderResult(containerId, title, rows, formula) {
    var html = '<div class="result-card">';
    html += '<h3>✓ ' + title + '</h3>';
    for (var i = 0; i < rows.length; i++) {
        html += '<div class="result-row">';
        html += '<span class="result-label">' + rows[i][0] + '</span>';
        html += '<span class="result-value">' + rows[i][1] + '</span>';
        html += '</div>';
    }
    if (formula) {
        html += '<div class="result-formula">' + formula + '</div>';
    }
    html += '</div>';
    document.getElementById(containerId).innerHTML = html;
}

// === Berechnungen ===

// 1. Auflagerreaktionen
document.getElementById('form-auflager').addEventListener('submit', function(e) {
    e.preventDefault();
    var F = parseFloat(document.getElementById('auflager-F').value);
    var L = parseFloat(document.getElementById('auflager-L').value);
    var a = parseFloat(document.getElementById('auflager-a').value);
    var b = L - a;

    if (a > L || a < 0) {
        alert('Der Abstand a muss zwischen 0 und L liegen.');
        return;
    }

    var Rb = (F * a) / L;
    var Ra = F - Rb;

    renderResult('result-auflager', 'Auflagerreaktionen', [
        ['Auflagerkraft A (links)', fmt(Ra, 'kN')],
        ['Auflagerkraft B (rechts)', fmt(Rb, 'kN')],
        ['Abstand b = L - a', fmt(b, 'm')],
        ['Kontrolle: A + B', fmt(Ra + Rb, 'kN')]
    ], 'ΣM_B = 0: A = F·b/L = ' + F + '·' + b.toFixed(2) + '/' + L + ' = ' + Ra.toFixed(2) + ' kN');
});

// 2. Kräftezerlegung
document.getElementById('form-kraeftezerlegung').addEventListener('submit', function(e) {
    e.preventDefault();
    var F = parseFloat(document.getElementById('kraft-F').value);
    var alpha = parseFloat(document.getElementById('kraft-alpha').value);
    var rad = alpha * Math.PI / 180;

    var Fx = F * Math.cos(rad);
    var Fy = F * Math.sin(rad);

    renderResult('result-kraeftezerlegung', 'Kraftkomponenten', [
        ['F_x (horizontal)', fmt(Fx, 'kN', 3)],
        ['F_y (vertikal)', fmt(Fy, 'kN', 3)],
        ['Kontrolle: √(Fx² + Fy²)', fmt(Math.sqrt(Fx * Fx + Fy * Fy), 'kN', 3)]
    ], 'Fx = F·cos(α) = ' + F + '·cos(' + alpha + '°) = ' + Fx.toFixed(3) + ' kN');
});

// 3. Momentberechnung
document.getElementById('form-moment').addEventListener('submit', function(e) {
    e.preventDefault();
    var F = parseFloat(document.getElementById('moment-F').value);
    var d = parseFloat(document.getElementById('moment-d').value);

    var M = F * d;

    renderResult('result-moment', 'Moment', [
        ['Moment M', fmt(M, 'kNm')],
        ['Kraft F', fmt(F, 'kN')],
        ['Hebelarm d', fmt(d, 'm')]
    ], 'M = F · d = ' + F + ' · ' + d + ' = ' + M.toFixed(2) + ' kNm');
});

// 4. Flächenträgheitsmoment
document.getElementById('form-flaechentraegheit').addEventListener('submit', function(e) {
    e.preventDefault();
    var activeBtn = document.querySelector('.toggle-btn.active[data-group="querschnitt"]');
    var type = activeBtn ? activeBtn.dataset.toggle : 'rechteck';

    if (type === 'rechteck') {
        var b = parseFloat(document.getElementById('ft-b').value);
        var h = parseFloat(document.getElementById('ft-h').value);
        if (!b || !h) { alert('Bitte Breite und Höhe eingeben.'); return; }

        var Iy = (b * Math.pow(h, 3)) / 12;
        var Iz = (h * Math.pow(b, 3)) / 12;
        var A = b * h;

        renderResult('result-flaechentraegheit', 'Rechteckquerschnitt', [
            ['Fläche A', fmt(A, 'mm²')],
            ['I_y (um y-Achse)', fmt(Iy, 'mm⁴')],
            ['I_z (um z-Achse)', fmt(Iz, 'mm⁴')],
            ['W_y = I_y / (h/2)', fmt(Iy / (h / 2), 'mm³')]
        ], 'Iy = b·h³/12 = ' + b + '·' + h + '³/12 = ' + Iy.toFixed(2) + ' mm⁴');
    } else {
        var d = parseFloat(document.getElementById('ft-d').value);
        if (!d) { alert('Bitte Durchmesser eingeben.'); return; }

        var I = (Math.PI * Math.pow(d, 4)) / 64;
        var Ak = (Math.PI * Math.pow(d, 2)) / 4;

        renderResult('result-flaechentraegheit', 'Kreisquerschnitt', [
            ['Fläche A', fmt(Ak, 'mm²')],
            ['I (Trägheitsmoment)', fmt(I, 'mm⁴')],
            ['W = I / (d/2)', fmt(I / (d / 2), 'mm³')]
        ], 'I = π·d⁴/64 = π·' + d + '⁴/64 = ' + I.toFixed(2) + ' mm⁴');
    }
});

// 5. Normalspannung
document.getElementById('form-spannung').addEventListener('submit', function(e) {
    e.preventDefault();
    var M = parseFloat(document.getElementById('sp-M').value);
    var W = parseFloat(document.getElementById('sp-W').value);

    // M in kNm → Nmm: * 1e6, W in cm³ → mm³: * 1e3
    var M_Nmm = M * 1e6;
    var W_mm3 = W * 1e3;
    var sigma = M_Nmm / W_mm3; // N/mm² = MPa

    renderResult('result-spannung', 'Normalspannung', [
        ['Spannung σ', fmt(sigma, 'N/mm² (MPa)')],
        ['Biegemoment M', fmt(M, 'kNm') + ' = ' + fmt(M_Nmm, 'Nmm')],
        ['Widerstandsmoment W', fmt(W, 'cm³') + ' = ' + fmt(W_mm3, 'mm³')]
    ], 'σ = M / W = ' + M_Nmm.toFixed(0) + ' / ' + W_mm3.toFixed(0) + ' = ' + sigma.toFixed(2) + ' N/mm²');
});

// 6. Durchbiegung
document.getElementById('form-durchbiegung').addEventListener('submit', function(e) {
    e.preventDefault();
    var activeBtn = document.querySelector('.toggle-btn.active[data-group="lastfall"]');
    var type = activeBtn ? activeBtn.dataset.toggle : 'gleichlast';

    var L = parseFloat(document.getElementById('db-L').value);
    var E = parseFloat(document.getElementById('db-E').value);
    var I = parseFloat(document.getElementById('db-I').value);

    // Einheiten: L in m → mm, E in N/mm², I in cm⁴ → mm⁴
    var L_mm = L * 1000;
    var I_mm4 = I * 1e4;
    var f;
    var formel;

    if (type === 'gleichlast') {
        var q = parseFloat(document.getElementById('db-q').value);
        if (!q) { alert('Bitte Streckenlast eingeben.'); return; }
        // q in kN/m → N/mm
        var q_Nmm = q * 1e3 / 1e3; // kN/m = N/mm
        f = (5 * q_Nmm * Math.pow(L_mm, 4)) / (384 * E * I_mm4);
        formel = 'f = 5·q·L⁴ / (384·E·I) = ' + f.toFixed(2) + ' mm';
    } else {
        var F = parseFloat(document.getElementById('db-F').value);
        if (!F) { alert('Bitte Einzellast eingeben.'); return; }
        var F_N = F * 1000;
        f = (F_N * Math.pow(L_mm, 3)) / (48 * E * I_mm4);
        formel = 'f = F·L³ / (48·E·I) = ' + f.toFixed(2) + ' mm';
    }

    var grenzwert = L_mm / 300;

    renderResult('result-durchbiegung', 'Durchbiegung', [
        ['Maximale Durchbiegung f', fmt(f, 'mm')],
        ['Grenzwert L/300', fmt(grenzwert, 'mm')],
        ['Nachweis f ≤ L/300', f <= grenzwert ? '✓ erfüllt' : '✗ nicht erfüllt']
    ], formel);
});

// === Reset: Ergebnisse löschen ===
document.querySelectorAll('form').forEach(function(form) {
    form.addEventListener('reset', function() {
        var section = form.closest('.task-view');
        if (section) {
            var resultDiv = section.querySelector('.task-result');
            if (resultDiv) resultDiv.innerHTML = '';
        }
    });
});
