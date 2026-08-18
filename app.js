document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const assetPreset = document.getElementById('asset-preset');
    const pointValue = document.getElementById('point-value');
    const positionSize = document.getElementById('position-size');
    const accountBalance = document.getElementById('account-balance');
    const entryPrice = document.getElementById('entry-price');
    const stopPrice = document.getElementById('stop-price');
    const dirInputs = document.querySelectorAll('input[name="direction"]');
    
    const resRiskPoints = document.getElementById('res-risk-points');
    const resRiskUsd = document.getElementById('res-risk-usd');
    const resRiskPct = document.getElementById('res-risk-pct');
    const targetsTableBody = document.querySelector('#targets-table tbody');

    // Update point value based on preset
    assetPreset.addEventListener('change', (e) => {
        if (e.target.value !== 'custom') {
            pointValue.value = e.target.value;
        }
        calculate();
    });

    // Listen to all inputs for auto-calculation
    const inputs = [pointValue, positionSize, accountBalance, entryPrice, stopPrice];
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
        const isLong = document.getElementById('dir-long').checked;

        // Clear table and reset summaries if inputs are invalid
        if (isNaN(entry) || isNaN(stop) || entry === 0 || stop === 0) {
            targetsTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color: var(--text-muted)">Insira os preços de Entrada e Stop para calcular.</td></tr>';
            resRiskPoints.textContent = '0.00 pts';
            resRiskUsd.textContent = '$0.00';
            resRiskPct.textContent = '-%';
            return;
        }

        // Validate direction vs prices (optional warning logic could go here)
        // For calculation we just use absolute difference
        const riskInPoints = Math.abs(entry - stop);
        const totalRiskUsd = riskInPoints * pVal * pSize;

        // Update Summary
        resRiskPoints.textContent = riskInPoints.toFixed(2) + ' pts';
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
