// app.jsx

// Use React from the global React object loaded via CDN
const { useState, useMemo } = React;

// --- PALETTE CONSTANTS ---
const PURPLE_5 = '#3B2179'; // Primary Accent, Headers, Buttons
const PURPLE_2 = '#B5A3F8'; // Success/Healthy Status, Positive Yield
const ORANGE_4 = '#F96C53'; // Warning/Tight Status
const MAGENTA_5 = '#A516C7'; // Danger/Not Sustainable
const PURPLE_1_LIGHT = '#CFD5FE'; // Light Backgrounds

// --- TOOLTIP ---
const InfoTooltip = ({ content }) => (
  <div className="relative inline-block group">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-gray-500 cursor-pointer"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
    {/* Tooltip (opens to the right) */}
    <span
      className="absolute left-full top-0 ml-2 p-2 w-48 text-xs text-white bg-gray-800 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none"
    >
      {content}
    </span>
  </div>
);

// --- GLOBAL CONSTANTS ---
const TIERS = [
  { id: '1', label: 'Tier 1 – FICO 680–850', ottriFee: 0.25, residual: 0.80 },
  { id: '2', label: 'Tier 2 – FICO 640–679', ottriFee: 0.75, residual: 0.70 },
  { id: '3', label: 'Tier 3 – FICO 600–639', ottriFee: 1.50, residual: 0.60 },
  { id: '4', label: 'Tier 4 – FICO 550–599', ottriFee: 2.50, residual: 0.50 },
];

// --- PAGE 1: OTTRI ECONOMICS CONFIG ---
const OttriEconomicsConfig = ({
  tiers,
  setTiers,
  markupTiers,
  setMarkupTiers,
  fundedVolume,
  setFundedVolume,
  markupShares,
  setMarkupShares,
}) => {
  // --- State and Logic ---
  const handleTierFeeChange = (id, field, value) => {
    const numericValue = parseFloat(value);
    setTiers(prevTiers =>
      prevTiers.map(tier =>
        tier.id === id
          ? { ...tier, [field]: isNaN(numericValue) ? 0 : numericValue }
          : tier
      )
    );
  };

  const handleMarkupTierChange = (tier, value) => {
    const numericValue = parseFloat(value);
    setMarkupTiers(prev => ({
      ...prev,
      [tier]: isNaN(numericValue) ? 0 : numericValue,
    }));
  };

  const handleMarkupShareChange = (tier, value) => {
    const numericValue = parseFloat(value);
    setMarkupShares(prev => ({
      ...prev,
      [tier]: isNaN(numericValue) ? 0 : numericValue,
    }));
  };

  const averageBakedFee = useMemo(() => {
    if (tiers.length === 0) return 0;
    const totalFee = tiers.reduce((sum, tier) => sum + tier.ottriFee, 0);
    return totalFee / tiers.length;
  }, [tiers]);

  const scenarioBakedFee = averageBakedFee;
  const totalShare = markupShares.A + markupShares.B + markupShares.C;
  const sharesValid = totalShare === 100;

  const blendedMarkupTakeRate = useMemo(() => {
    if (!sharesValid) return 0;
    const markupA = markupTiers.A * (markupShares.A / 100);
    const markupB = markupTiers.B * (markupShares.B / 100);
    const markupC = markupTiers.C * (markupShares.C / 100);
    return markupA + markupB + markupC;
  }, [markupTiers, markupShares, sharesValid]);

  const totalBlendedTakeRate = scenarioBakedFee + blendedMarkupTakeRate;
  const expectedGrossRevenue = fundedVolume * (totalBlendedTakeRate / 100);
  const revenuePerMillion = 1_000_000 * (totalBlendedTakeRate / 100);

  // Chart Data
  const volumePoints = [10_000_000, 25_000_000, 50_000_000, 100_000_000];
  const revenueData = volumePoints.map(vol => ({
    volume: vol,
    revenue: vol * (totalBlendedTakeRate / 100),
  }));

  // Helper for formatting currency
  const formatCurrency = value =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <div className="p-4 md:p-8 space-y-8 bg-white rounded-lg shadow-xl">
      <h1
        className="text-3xl font-bold border-b pb-2 mb-6"
        style={{ color: PURPLE_5 }}
      >
        Ottri Economics Config (Page 1)
      </h1>

      {/* 1. Intro Block */}
      <div
        className="border-l-4 p-4 rounded-lg"
        style={{ backgroundColor: PURPLE_1_LIGHT, borderColor: PURPLE_5 }}
      >
        <h2
          className="text-xl font-semibold mb-2"
          style={{ color: PURPLE_5 }}
        >
          How to use this page
        </h2>
        <p className="text-gray-700 text-sm">
          This page allows Ottri to model and test different baked fee and
          merchant markup strategies across 4 FICO tiers, providing a clear view
          of the impact on total blended take rate and expected revenue based on
          funded volume. Typical healthy ranges: Baked fees range from 0–0.5%
          (super prime) up to 2–5% (higher risk), and merchant markups usually
          fall between 1–4%. Use this tool to set Ottri&apos;s target pricing
          strategy.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN - Configuration */}
        <div className="lg:col-span-2 space-y-8">
          {/* 2. Ottri Baked Fee by Tier */}
          <section>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Ottri Baked Fee by Tier
            </h2>
            <div className="overflow-x-auto bg-gray-50 p-4 rounded-lg shadow-inner">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Tier Label
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Ottri Baked Fee (%)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tiers.map(tier => (
                    <tr key={tier.id}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {tier.label}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <input
                          type="number"
                          step="0.05"
                          min="0"
                          value={tier.ottriFee}
                          onChange={e =>
                            handleTierFeeChange(
                              tier.id,
                              'ottriFee',
                              e.target.value
                            )
                          }
                          className="w-24 p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500 text-sm"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-gray-600">
              Suggested baked fees (for reference): 0.10% (T1), 0.50% (T2),
              1.50% (T3), 3.50% (T4). This serves as a soft guideline.
            </p>
          </section>

          {/* 4. Ottri Markup Strategy */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-700 flex items-center">
              Ottri Markup Strategy
              <span className="ml-2">
                <InfoTooltip
                  content="Markup tiers are additional dealer fees charged to merchants on top of lender pricing. They do not affect lender yield directly; they are Ottri’s margin lever."
                />
              </span>
            </h2>

            {/* Markup Tiers */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg shadow-inner">
              {['A', 'B', 'C'].map(tier => (
                <div key={`markup-${tier}`}>
                  <label
                    htmlFor={`markup-tier-${tier}`}
                    className="block text-sm font-medium text-gray-700"
                  >
                    Markup Tier {tier} (%)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    id={`markup-tier-${tier}`}
                    value={markupTiers[tier]}
                    onChange={e =>
                      handleMarkupTierChange(tier, e.target.value)
                    }
                    className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              ))}
            </div>

            {/* Markup Usage Distribution */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg shadow-inner">
              {['A', 'B', 'C'].map(tier => (
                <div key={`share-${tier}`}>
                  <label
                    htmlFor={`share-tier-${tier}`}
                    className="block text-sm font-medium text-gray-700"
                  >
                    Percent using Tier {tier}
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    id={`share-tier-${tier}`}
                    value={markupShares[tier]}
                    onChange={e =>
                      handleMarkupShareChange(tier, e.target.value)
                    }
                    className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              ))}
              <div className="col-span-3">
                <p className="text-sm font-medium text-gray-700">
                  Total Share:{' '}
                  <span
                    className={
                      sharesValid
                        ? 'font-bold'
                        : 'text-red-600 font-bold'
                    }
                    style={{ color: sharesValid ? PURPLE_2 : undefined }}
                  >
                    {totalShare} %
                  </span>
                </p>
                {!sharesValid && (
                  <p className="text-red-500 text-xs mt-1">
                    Warning: Markup shares must sum to 100% for an accurate
                    blended rate.
                  </p>
                )}
              </div>
            </div>

            <div
              className="p-4 rounded-lg shadow-md"
              style={{ backgroundColor: PURPLE_1_LIGHT }}
            >
              <label
                className="block text-sm font-bold"
                style={{ color: PURPLE_5 }}
              >
                Blended Markup Take Rate
              </label>
              <p
                className="text-2xl font-extrabold mt-1"
                style={{ color: PURPLE_5 }}
              >
                {blendedMarkupTakeRate.toFixed(2)} %
              </p>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN - Summary and Charts */}
        <div className="lg:col-span-1 space-y-8">
          {/* 5. Blended Take Rate Summary */}
          <section
            className="p-6 rounded-lg shadow-lg"
            style={{ backgroundColor: PURPLE_2 }}
          >
            <h2 className="text-xl font-semibold text-white mb-4">
              Blended Take Rate Summary
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-white">
                <span className="font-medium">Average Baked Fee (%)</span>
                <span className="text-lg font-bold text-white">
                  {scenarioBakedFee.toFixed(2)} %
                </span>
              </div>
              <div className="flex justify-between items-center text-white">
                <span className="font-medium">Blended Markup Fee (%)</span>
                <span className="text-lg font-bold text-white">
                  {blendedMarkupTakeRate.toFixed(2)} %
                </span>
              </div>
              <div className="border-t pt-3 flex justify-between items-center text-white">
                <span className="font-extrabold text-xl">
                  Total Blended Take Rate (%)
                </span>
                <span className="text-3xl font-extrabold">
                  {totalBlendedTakeRate.toFixed(2)} %
                </span>
              </div>
            </div>
          </section>

          {/* 6. Volume and Revenue Simulation */}
          <section
            className="p-6 rounded-lg shadow-lg space-y-4"
            style={{ backgroundColor: PURPLE_1_LIGHT }}
          >
            <h2
              className="text-xl font-semibold"
              style={{ color: PURPLE_5 }}
            >
              Volume and Revenue Simulation
            </h2>
            <div>
              <label
                htmlFor="funded-volume"
                className="block text-sm font-medium text-gray-700"
              >
                Funded Volume ($)
              </label>
              <input
                type="number"
                step="1000000"
                min="0"
                id="funded-volume"
                value={fundedVolume}
                onChange={e =>
                  setFundedVolume(parseFloat(e.target.value) || 0)
                }
                className="mt-1 w-full p-2 border border-gray-300 rounded-md text-base"
              />
            </div>
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center bg-white p-2 rounded-md shadow-sm">
                <span className="font-medium">
                  Expected Gross Revenue ($)
                </span>
                <span
                  className="text-lg font-bold"
                  style={{ color: PURPLE_5 }}
                >
                  {formatCurrency(expectedGrossRevenue)}
                </span>
              </div>
              <div className="flex justify-between items-center bg-white p-2 rounded-md shadow-sm">
                <span className="font-medium">Revenue per 1 Million ($)</span>
                <span
                  className="text-lg font-bold"
                  style={{ color: PURPLE_5 }}
                >
                  {formatCurrency(revenuePerMillion)}
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* 7. Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
        {/* Chart 1: Take Rate Composition */}
        <section className="p-6 bg-white rounded-lg shadow-lg border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Take Rate Composition
          </h2>
          <div className="space-y-4">
            {/* Baked Fee */}
            <div
              className="h-10 bg-gray-100 rounded-full flex items-center overflow-hidden"
              title={`Baked Fee: ${scenarioBakedFee.toFixed(2)}%`}
            >
              <div
                className="h-full rounded-l-full"
                style={{
                  width: `${
                    (scenarioBakedFee / totalBlendedTakeRate) * 100 || 0
                  }%`,
                  minWidth: '10px',
                  backgroundColor: PURPLE_5,
                }}
              ></div>
              <span className="ml-3 text-sm font-bold text-gray-700 whitespace-nowrap">
                {scenarioBakedFee.toFixed(2)}%
              </span>
            </div>
            <p className="text-sm font-medium">Average Baked Fee</p>

            {/* Markup Fee */}
            <div
              className="h-10 bg-gray-100 rounded-full flex items-center overflow-hidden"
              title={`Markup Fee: ${blendedMarkupTakeRate.toFixed(2)}%`}
            >
              <div
                className="h-full rounded-l-full"
                style={{
                  width: `${
                    (blendedMarkupTakeRate / totalBlendedTakeRate) * 100 ||
                    0
                  }%`,
                  minWidth: '10px',
                  backgroundColor: ORANGE_4,
                }}
              ></div>
              <span className="ml-3 text-sm font-bold text-gray-700 whitespace-nowrap">
                {blendedMarkupTakeRate.toFixed(2)}%
              </span>
            </div>
            <p className="text-sm font-medium">Blended Markup Fee</p>

            {/* Total Take Rate */}
            <div
              className="h-10 bg-gray-100 rounded-full flex items-center overflow-hidden"
              title={`Total Take Rate: ${totalBlendedTakeRate.toFixed(2)}%`}
            >
              <div
                className="h-full rounded-full flex items-center justify-center text-white font-bold"
                style={{ width: '100%', backgroundColor: PURPLE_5 }}
              >
                {totalBlendedTakeRate.toFixed(2)}%
              </div>
            </div>
            <p className="text-sm font-medium">Total Take Rate</p>
          </div>
        </section>

        {/* Chart 2: Revenue vs Volume */}
        <section className="p-6 bg-white rounded-lg shadow-lg border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Revenue vs Funded Volume (at {totalBlendedTakeRate.toFixed(2)}% Take
            Rate)
          </h2>
          <div className="space-y-6">
            {revenueData.map(data => (
              <div key={data.volume} className="flex flex-col">
                <div className="flex justify-between text-sm font-medium text-gray-700">
                  <span>{formatCurrency(data.volume)} Volume</span>
                  <span>{formatCurrency(data.revenue)} Revenue</span>
                </div>
                <div
                  className="mt-1 h-3 rounded-full"
                  style={{ backgroundColor: PURPLE_1_LIGHT }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        (data.volume /
                          volumePoints[volumePoints.length - 1]) *
                        100
                      }%`,
                      backgroundColor: MAGENTA_5,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

// --- ROOT APP ---
const App = () => {
  const [tiers, setTiers] = useState(TIERS);
  const [markupTiers, setMarkupTiers] = useState({ A: 1.0, B: 2.0, C: 3.0 });
  const [markupShares, setMarkupShares] = useState({ A: 40, B: 30, C: 30 });
  const [fundedVolume, setFundedVolume] = useState(50_000_000);

  return (
    <div className="max-w-6xl w-full">
      <OttriEconomicsConfig
        tiers={tiers}
        setTiers={setTiers}
        markupTiers={markupTiers}
        setMarkupTiers={setMarkupTiers}
        fundedVolume={fundedVolume}
        setFundedVolume={setFundedVolume}
        markupShares={markupShares}
        setMarkupShares={setMarkupShares}
      />
    </div>
  );
};

// Mount the app
const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);
root.render(<App />);
