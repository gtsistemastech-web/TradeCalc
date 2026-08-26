document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const assetPreset = document.getElementById('asset-preset');
    const pointValue = document.getElementById('point-value');
    const positionSize = document.getElementById('position-size');
    const accountBalance = document.getElementById('account-balance');
    const entryPrice = document.getElementById('entry-price');
    const stopPrice = document.getElementById('stop-price');
    const stockPrice = document.getElementById('stock-price');
    const riskPercent = document.getElementById('risk-percent');
    const suggestedSize = document.getElementById('suggested-size');
    const spreadValue = document.getElementById('spread-value');
    const spreadUnit = document.getElementById('spread-unit');
    const stockPriceGroup = document.getElementById('stock-price-group');
    const riskRow = document.getElementById('risk-row');
    const positionSizeUnit = document.getElementById('position-size-unit');
    const dirInputs = document.querySelectorAll('input[name="direction"]');
    let manualSizeOverride = false;

    const resRiskPoints = document.getElementById('res-risk-points');
    const resRiskUsd = document.getElementById('res-risk-usd');
    const resRiskPct = document.getElementById('res-risk-pct');
    const resPositionValue = document.getElementById('res-position-value');
    const targetsTableBody = document.querySelector('#targets-table tbody');

    // Update point value based on preset
    assetPreset.addEventListener('change', (e) => {
        const v = e.target.value;
        const opt = e.target.selectedOptions[0];
        const isStock = !!opt.dataset.price;

        if (v !== 'custom') {
            pointValue.value = v;
        }
        positionSizeUnit.textContent = '(' + (isStock ? 'Ações' : 'Lotes') + ')';
        stockPriceGroup.hidden = !isStock;
        riskRow.hidden = !isStock;
        if (isStock && opt.dataset.price) {
            stockPrice.value = opt.dataset.price;
        } else if (!isStock) {
            stockPrice.value = '';
        }
        suggestedSize.value = '';
        manualSizeOverride = false;
        calculate();
    });

    // If the user manually edits the position size, stop auto-suggesting
    // (registered before calculate() listeners so the flag is set first)
    positionSize.addEventListener('input', () => {
        manualSizeOverride = true;
    });

    // Listen to all inputs for auto-calculation
    const inputs = [pointValue, positionSize, accountBalance, entryPrice, stopPrice, stockPrice, riskPercent, spreadValue];
    spreadUnit.addEventListener('change', calculate);
    inputs.forEach(input => input.addEventListener('input', calculate));
    dirInputs.forEach(input => input.addEventListener('change', calculate));

    // Formatter for Currency
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    };

    // Main calculation function
    function calculate() {
        const pVal = parseFloat(pointValue.value) || 0;
        const pSize = parseFloat(positionSize.value) || 0;
        const aBal = parseFloat(accountBalance.value) || 0;
        const entry = parseFloat(entryPrice.value);
        const stop = parseFloat(stopPrice.value);
        const sPrice = parseFloat(stockPrice.value);
        const riskPct = parseFloat(riskPercent.value) || 0;
        const spValue = parseFloat(spreadValue.value) || 0;
        const spUnit = spreadUnit.value;
        const isLong = document.getElementById('dir-long').checked;
        const isStock = !stockPriceGroup.hidden;

        // Convert spread to points based on the selected unit
        let spreadPts = 0;
        if (spValue > 0) {
            if (spUnit === 'pts') {
                spreadPts = spValue;
            } else if (spUnit === 'pct') {
                // % of the entry price → spread in points
                spreadPts = entry * (spValue / 100);
            } else if (spUnit === 'usd') {
                // $ per unit → spread in points = $ value / point value (for stocks, $1/pt)
                spreadPts = spValue / pVal;
            }
        }

        // Clear table and reset summaries if inputs are invalid
        if (isNaN(entry) || isNaN(stop) || entry === 0 || stop === 0) {
            targetsTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color: var(--text-muted)">Insira os preços de Entrada e Stop para calcular.</td></tr>';
            resRiskPoints.textContent = '0.00 pts';
            resRiskUsd.textContent = '$0.00';
            resRiskPct.textContent = '-%';
            resPositionValue.textContent = '—';
            return;
        }

        // Validate direction vs prices (optional warning logic could go here)
        // For calculation we just use absolute difference
        const riskInPoints = Math.abs(entry - stop);
        const riskInPointsWithSpread = riskInPoints + spreadPts;

        // Suggested position size for US stocks (risk-based)
        let effectiveSize = pSize;
        if (isStock && aBal > 0 && riskPct > 0 && riskInPoints > 0 && sPrice > 0) {
            const riskAmount = aBal * (riskPct / 100);
            const suggested = riskAmount / (riskInPointsWithSpread * pVal);
            suggestedSize.value = suggested.toFixed(2);
            // Auto-preenche o campo de posição com a sugestão, a menos que o usuário já tenha digitado manualmente
            if (!manualSizeOverride) {
                positionSize.value = suggested.toFixed(2);
                effectiveSize = suggested;
            }
        } else if (isStock) {
            suggestedSize.value = '';
        }

        const totalRiskUsd = riskInPointsWithSpread * pVal * effectiveSize;

        // Position value (stock price × quantity) — for stocks with price filled in
        if (isStock && sPrice > 0 && effectiveSize > 0) {
            resPositionValue.textContent = formatCurrency(sPrice * effectiveSize);
        } else {
            resPositionValue.textContent = '—';
        }

        // Update Summary
        resRiskPoints.textContent = riskInPointsWithSpread.toFixed(2) + ' pts';
        resRiskUsd.textContent = '-' + formatCurrency(totalRiskUsd);
        
        if (aBal > 0) {
            const riskPct = (totalRiskUsd / aBal) * 100;
            resRiskPct.textContent = riskPct.toFixed(2) + '%';
        } else {
            resRiskPct.textContent = '-%';
        }

        // Generate Targets Table (1R to 8R)
        targetsTableBody.innerHTML = '';
        
        for (let i = 1; i <= 8; i++) {
            const tr = document.createElement('tr');
            
            // Target Label
            const tdLabel = document.createElement('td');
            tdLabel.textContent = i + 'º Parcial';
            
            // R-Multiple
            const tdRatio = document.createElement('td');
            const spanBadge = document.createElement('span');
            spanBadge.className = 'badge';
            spanBadge.textContent = i + 'x1';
            tdRatio.appendChild(spanBadge);

            // Target Price
            const targetPrice = isLong ? (entry + (riskInPoints * i)) : (entry - (riskInPoints * i));
            const tdPrice = document.createElement('td');
            tdPrice.textContent = targetPrice.toFixed(2);

            // Gain USD
            const gainUsd = totalRiskUsd * i;
            const tdGainUsd = document.createElement('td');
            tdGainUsd.textContent = '+' + formatCurrency(gainUsd);
            tdGainUsd.className = 'gain-positive';

            // Gain Pct
            const tdGainPct = document.createElement('td');
            if (aBal > 0) {
                const gainPct = (gainUsd / aBal) * 100;
                tdGainPct.textContent = '+' + gainPct.toFixed(2) + '%';
                tdGainPct.className = 'gain-positive';
            } else {
                tdGainPct.textContent = '-';
            }

            tr.appendChild(tdLabel);
            tr.appendChild(tdRatio);
            tr.appendChild(tdPrice);
            tr.appendChild(tdGainUsd);
            tr.appendChild(tdGainPct);
            
            targetsTableBody.appendChild(tr);
        }
    }

    // Initial render
    calculate();
});
