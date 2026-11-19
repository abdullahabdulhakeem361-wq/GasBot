import React from 'react';
import ReactDOM from 'react-dom';

const { useState, useEffect } = React;

function App() {
  const [gas, setGas] = useState({
    low: null,
    standard: null,
    fast: null
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [gasLimit, setGasLimit] = useState('21000');
  const [ethPrice, setEthPrice] = useState('2500');
  const [selectedSpeed, setSelectedSpeed] = useState('standard');
     async function fetchGasPrices() {
    setLoading(true);
    setError('');

    try {
      const ALCHEMY_API_KEY = 'alch_YUQHX-p-noxNNXFn9HXmy';

const ETH_RPC_URL =
  `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
const response = await fetch(ETH_RPC_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_feeHistory',
            params: ['0x5', 'latest', [10, 50, 90]
            ],
            id: 1
          })
        }
      );

      if (!response.ok) {
        throw new Error('Network request failed');
      }


      const data = await response.json();

if (!data.result || !data.result.baseFeePerGas || !data.result.reward) {
  throw new Error('Gas data unavailable');
}

const baseFees = data.result.baseFeePerGas;
const rewards = data.result.reward;

const latestBaseFee = Number(
  BigInt(baseFees[baseFees.length - 1])
) / 1e9;

const averagePriorityFee = (percentileIndex) => {
  const values = rewards
    .map(block => Number(BigInt(block[percentileIndex])) / 1e9)
    .filter(value => Number.isFinite(value));
  
  if (values.length === 0) return 0;
  
  return values.reduce((total, value) => total + value, 0) / values.length;
};

const lowFee = latestBaseFee + averagePriorityFee(0);
const standardFee = latestBaseFee + averagePriorityFee(1);
const fastFee = latestBaseFee + averagePriorityFee(2);

setGas({
  low: lowFee,
  standard: standardFee,
  fast: fastFee
});
      setLastUpdated(new Date());
    } catch (err) {
      setError('Unable to load gas prices. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchGasPrices();

    const timer = setInterval(fetchGasPrices, 30000);

    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
  const fetchEthPrice = async () => {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch ETH price');
      }
      
      const data = await response.json();
      
      setEthPrice(data.ethereum.usd);
      
    } catch (error) {
      console.error('ETH price error:', error);
    }
  };
  
  fetchEthPrice();
  
  const interval = setInterval(fetchEthPrice, 30000);
  
  return () => clearInterval(interval);
}, []);

  const selectedGasPrice = gas[selectedSpeed];

const estimatedFee =
  selectedGasPrice !== null &&
  selectedGasPrice !== undefined &&
  gasLimit.trim() !== '' &&
  Number.isFinite(Number(gasLimit)) &&
  Number(gasLimit) > 0 ?
  Number(selectedGasPrice) * Number(gasLimit) / 1e9 :
  null;

  const estimatedUsd =
    estimatedFee !== null &&
    Number(ethPrice) > 0
      ? estimatedFee * Number(ethPrice)
      : null;

  return (
    <div className="app-shell">

      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">G</div>

          <div>
            <h1>GasBot</h1>
            <p>ETHEREUM GAS INTELLIGENCE</p>
          </div>
        </div>

        <div className="network-badge">
          <span className="status-dot"></span>
          Ethereum Mainnet
        </div>
      </header>

      <main className="dashboard">

        <section className="welcome">
          <p className="eyebrow">
            YOUR WEB3 CONTROL CENTER
          </p>

          <h2>Understand your gas.</h2>

          <p className="welcome-text">
            Monitor Ethereum gas prices and estimate
            transaction fees in one place.
          </p>
        </section>

        <section className="section-heading">
          <div>
            <h3>Network gas prices</h3>
            <p>Current gas-price reading and estimates.</p>
          </div>

          <button
            className="refresh-button"
            onClick={fetchGasPrices}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : '↻ Refresh'}
          </button>
        </section>

        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        <section className="gas-grid">

          <GasCard
            title="Low"
            description="Lower price estimate"
            value={gas.low}
            type="low"
          />

          <GasCard
            title="Standard"
            description="Current gas-price reading"
            value={gas.standard}
            type="standard"
          />

          <GasCard
            title="Fast"
            description="Higher price estimate"
            value={gas.fast}
            type="fast"
          />

        </section>
                <section className="eth-price-panel">
          <div>
            <p className="card-label">ETHEREUM MARKET PRICE</p>
            <h3>Live ETH Price</h3>
            <p className="card-description">
              Current Ethereum price in US dollars
            </p>
          </div>

          <div className="eth-market-value">
            {Number(ethPrice) > 0
              ? `$${Number(ethPrice).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}`
              : 'Loading price...'}
          </div>
        </section>
        

        <p className="updated-text">
          {loading
            ? 'Updating network data...'
            : lastUpdated
              ? `Last updated: ${lastUpdated.toLocaleTimeString()}`
              : 'Waiting for gas-price data'}
        </p>

        <section className="calculator-panel">

          <div className="panel-heading">
            <div>
              <p className="eyebrow">
                TRANSACTION PLANNER
              </p>

              <h3>Gas fee calculator</h3>
            </div>

            <span className="calculator-icon">⌁</span>
          </div>

          <p className="calculator-description">
            Estimate a transaction fee using the current
            standard gas-price reading.
          </p>

          <div className="input-grid">

            <label>
              Gas limit

              <input
                type="number"
                min="1"
                value={gasLimit}
                onChange={(event) =>
                  setGasLimit(event.target.value)
                }
              />

              <span className="input-hint">
                Standard ETH transfer: usually 21,000
              </span>
            </label>

            <label>
              ETH price in USD

              <input
                type="number"
                min="0"
                step="any"
                value={ethPrice}
                onChange={(event) =>
                  setEthPrice(event.target.value)
                }
              />

              <span className="input-hint">
                 Ethereum  live price
              </span>
            </label>

          </div>

          <div className="fee-result">

            <div>
              <p>Estimated transaction fee</p>

              <strong>
                {estimatedFee !== null &&
                Number.isFinite(estimatedFee)
                  ? `${estimatedFee.toFixed(8)} ETH`
                  : 'Enter valid values'}
              </strong>
            </div>

            <div className="usd-result">
              <p>Estimated USD value</p>

              <strong>
                {estimatedUsd !== null &&
                Number.isFinite(estimatedUsd)
                  ? `$${estimatedUsd.toFixed(4)}`
                  : '—'}
              </strong>
            </div>

          </div>

          <p className="disclaimer">
            Estimates only. Actual transaction fees depend
            on network conditions and transaction execution.
          </p>

        </section>

        <section className="info-panel">
          <div className="info-icon">i</div>

          <div>
            <h3>What is a gas fee?</h3>

            <p>
              Gas measures the computational work required
              to execute transactions on Ethereum. Your
              transaction fee depends on the gas used and
              the effective gas price paid.
            </p>
          </div>
        </section>

        <footer className="footer">
          <p>GasBot · Independent Web3 utility</p>
          <p>Built for clearer blockchain decisions.</p>
        </footer>

      </main>
    </div>
  );
}

function GasCard({ title, description, value, type }) {
  return (
    <article className={`gas-card ${type}`}>

      <div className="card-top">
        <span className="card-label">{title}</span>
        <span className="card-indicator"></span>
      </div>

      <div>
       <p className="gas-value">
  {value === null
    ? '—'
    : Number(value).toFixed(4)}
  <span> Gwei</span>
</p>
        <p className="card-description">
          {description}
        </p>
      </div>

    </article>
  );
}

ReactDOM.createRoot(
  document.getElementById('root')
).render(<App />);