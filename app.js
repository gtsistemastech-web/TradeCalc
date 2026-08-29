document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const assetPreset = document.getElementById('asset-preset');
    const pointValue = document.getElementById('point-value');
    const positionSize = document.getElementById('position-size');
    const accountBalance = document.getElementById('account-balance');
    const entryPrice = document.getElementById('entry-price');
    const stopPrice = document.getElementById('stop-price');
    const stockPrice = document.getElementById('stock-price');
    const riskValue = document.getElementById('risk-value');
    const riskUnit = document.getElementById('risk-unit');
    const suggestedSize = document.getElementById('suggested-size');
    const suggestedSizeUnit = document.getElementById('suggested-size-unit');
    const spreadValue = document.getElementById('spread-value');
    const spreadUnit = document.getElementById('spread-unit');
    const stockPriceGroup = document.getElementById('stock-price-group');
    const stopPerContract = document.getElementById('stop-per-contract');
    const stopPerContractRow = document.getElementById('stop-per-contract-row');
    const stopPcLabel = document.getElementById('stop-pc-label');
    const stopPcHint = document.getElementById('stop-pc-hint');
    const pricesRow = document.getElementById('prices-row');
    const spreadRow = document.getElementById('spread-row');
    const positionSizeUnit = document.getElementById('position-size-unit');
    const modeInputs = document.querySelectorAll('input[name="calc-mode"]');
    const dirInputs = document.querySelectorAll('input[name="direction"]');
    let manualSizeOverride = false;

    const getMode = () => document.querySelector('input[name="calc-mode"]:checked').value;

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
        suggestedSizeUnit.textContent = '(' + (isStock ? 'Ações' : 'Lotes') + ')';
        if (isStock && opt.dataset.price) {
            stockPrice.value = opt.dataset.price;
        } else if (!isStock) {
            stockPrice.value = '';
        }
        suggestedSize.value = '';
        manualSizeOverride = false;
        updateModeVisibility();
        updateStopLabel();
        calculate();
    });

    // Toggle visibility between price-mode and stop-mode fields
    function updateModeVisibility() {
        const mode = getMode();
        const isStock = !stockPriceGroup.hidden || !!assetPreset.selectedOptions[0].dataset.price;
        stockPriceGroup.hidden = !isStock;
        // In stop-mode, prices/spread are hidden; in price-mode, stop field hidden
        pricesRow.hidden = (mode === 'stop');
        spreadRow.hidden = (mode === 'stop');
        stopPerContractRow.hidden = (mode === 'price');
    }

    // Rotula o campo de valor do stop conforme o ativo
    function updateStopLabel() {
        const opt = assetPreset.selectedOptions[0];
        const isStock = !!opt.dataset.price;
        const v = opt.value;
        let noun = 'Contrato';
        let qtyNoun = 'Ações';
        if (!isStock && v === '10') {
            // HK50 spot → tick fracionado
            noun = 'Ponto (tick)';
            qtyNoun = 'Lotes';
        } else if (!isStock) {
            noun = 'Ponto';
            qtyNoun = 'Lotes';
        }
        stopPcLabel.innerHTML = 'Valor do Stop por ' + noun + ' ($) <span class="optional">da BlackArrow</span>';
        stopPcHint.textContent = qtyNoun + ' = Perda Máxima ÷ Valor do Stop por ' + noun;
    }

    modeInputs.forEach(input => input.addEventListener('change', () => {
        manualSizeOverride = false;
        updateModeVisibility();
        calculate();
    }));

    // If the user manually edits the position size, stop auto-suggesting
    // (registered before calculate() listeners so the flag is set first)
    // Clearing the field (empty) re-enables auto-suggest
    positionSize.addEventListener('input', () => {
        manualSizeOverride = positionSize.value !== '';
    });

    // Listen to all inputs for auto-calculation
    const inputs = [pointValue, positionSize, accountBalance, entryPrice, stopPrice, stockPrice, riskValue, spreadValue, stopPerContract];
    spreadUnit.addEventListener('change', calculate);
    riskUnit.addEventListener('change', calculate);
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
        const rvValue = parseFloat(riskValue.value) || 0;
        const rvUnit = riskUnit.value;
        const spValue = parseFloat(spreadValue.value) || 0;
        const spUnit = spreadUnit.value;
        const stopPc = parseFloat(stopPerContract.value) || 0;
        const isLong = document.getElementById('dir-long').checked;
        const mode = getMode();
        const isStock = !!assetPreset.selectedOptions[0].dataset.price;

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

        // Resolve the maximum loss in $
        const riskAmount = rvUnit === 'usd' ? rvValue : (aBal > 0 ? aBal * (rvValue / 100) : 0);

        const isStopMode = mode === 'stop';
        // Clear table and reset summaries if inputs are invalid
        const invalid = isStopMode ? riskAmount <= 0 : (isNaN(entry) || isNaN(stop) || entry === 0 || stop === 0);
        if (invalid) {
            targetsTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color: var(--text-muted)">' + (isStopMode ? 'Informe a Perda Máxima na Operação.' : 'Insira os preços de Entrada e Stop para calcular.') + '</td></tr>';
            resRiskPoints.textContent = '0.00 pts';
            resRiskUsd.textContent = '$0.00';
            resRiskPct.textContent = '-%';
            resPositionValue.textContent = '—';
            return;
        }

        // Suggested position size (risk-based)
        let effectiveSize = pSize;
        let riskInPoints = 0;
        let riskInPointsWithSpread = 0;
        let totalRiskUsd = 0;

        if (isStopMode) {
            // STOP MODE: contracts/lotes = max loss ÷ stop value
            if (stopPc > 0) {
                const suggested = riskAmount / stopPc;
                suggestedSize.value = suggested.toFixed(2);
                if (!manualSizeOverride) {
                    positionSize.value = suggested.toFixed(2);
                    effectiveSize = suggested;
                }
            } else {
                suggestedSize.value = '';
            }
            totalRiskUsd = effectiveSize * stopPc;
            resRiskPoints.textContent = stopPc > 0 ? ('$' + stopPc.toFixed(2) + '/lote') : '0.00 pts';
        } else {
            // PRICE MODE (indexes/forex/other): risk = |entry - stop| + spread, in points
            riskInPoints = Math.abs(entry - stop);
            riskInPointsWithSpread = riskInPoints + spreadPts;
            if (riskAmount > 0 && riskInPoints > 0 && pVal > 0) {
                const suggested = riskAmount / (riskInPointsWithSpread * pVal);
                suggestedSize.value = suggested.toFixed(2);
                if (!manualSizeOverride) {
                    positionSize.value = suggested.toFixed(2);
                    effectiveSize = suggested;
                }
            } else {
                suggestedSize.value = '';
            }
            totalRiskUsd = riskInPointsWithSpread * pVal * effectiveSize;
            resRiskPoints.textContent = riskInPointsWithSpread.toFixed(2) + ' pts';
        }

        // Position value (stock price × quantity) — for stocks with price filled in
        if (isStock && sPrice > 0 && effectiveSize > 0) {
            resPositionValue.textContent = formatCurrency(sPrice * effectiveSize);
        } else {
            resPositionValue.textContent = '—';
        }

        // Update Summary
        resRiskUsd.textContent = '-' + formatCurrency(totalRiskUsd);

        if (aBal > 0) {
            const riskPct = (totalRiskUsd / aBal) * 100;
            resRiskPct.textContent = riskPct.toFixed(2) + '%';
        } else {
            resRiskPct.textContent = '-%';
        }

        // Generate Targets Table (1R to 8R)
        targetsTableBody.innerHTML = '';
        if (isStock || isStopMode) {
            targetsTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color: var(--text-muted)">' + (isStock ? 'Para ações, o foco é a posição sugerida acima.' : 'No modo Por Valor do Stop, informe o preço de entrada e saída para ver os alvos 1R–8R.') + '</td></tr>';
        } else {
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
    }

    // Initial render
    calculate();
});
