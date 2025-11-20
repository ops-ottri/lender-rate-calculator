// app.jsx

const { useState, useMemo, useEffect } = React;

// ---------- HELPERS ----------
const formatNumberWithCommas = (value) => {
  if (value === null || value === undefined || value === '') return '';
  const num = Number(value);
  if (isNaN(num)) return '';
  return num.toLocaleString('en-US');
};

const parseNumberFromString = (value) => {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const cleaned = String(value).replace(/,/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value || 0);

// ---------- PALETTE ----------
const PURPLE_5 = '#3B2179';
const PURPLE_2 = '#B5A3F8';
const ORANGE_4 = '#F96C53';
const MAGENTA_5 = '#A516C7';
const PURPLE_1_LIGHT = '#CFD5FE';

// ---------- GLOBAL TIERS ----------
const TIERS = [
  { id: '1', label: 'Tier 1 – FICO 680–850', ottriFee: 0.25, residual: 0.8 },
  { id: '2', label: 'Tier 2 – FICO 640–679', ottriFee: 0.75, residual: 0.7 },
  { id: '3', label: 'Tier 3 – FICO 600–639', ottriFee: 1.5, residual: 0.6 },
  { id: '4', label: 'Tier 4 – FICO 550–599', ottriFee: 2.5, residual: 0.5 },
];

// ---------- SHARED COMPONENTS ----------
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
    <span className="absolute left-full top-0 ml-2 p-2 w-56 text-xs text-white bg-gray-800 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
      {content}
    </span>
  </div>
);

// =====================================================
// PAGE 1: OTTRI ECONOMICS CONFIG
// =====================================================
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
  // --- handlers ---
  const handleTierFeeChange = (id, field, value) => {
    const numericValue = parseNumberFromString(value);
    setTiers((prevTiers) =>
      prevTiers.map((tier) =>
        tier.id === id ? { ...tier, [field]: numericValue } : tier
      )
    );
  };

  const handleMarkupTierChange = (tierKey, value) => {
    const numericValue = parseNumberFromString(value);
    setMarkupTiers((prev) => ({ ...prev, [tierKey]: numericValue }));
  };

  const handleMarkupShareChange = (tierKey, value) => {
    const numericValue = parseNumberFromString(value);
    setMarkupShares((prev) => ({ ...prev, [tierKey]: numericValue }));
  };

  // --- calculations ---
  const averageBakedFee = useMemo(() => {
    if (!tiers.length) return 0;
    const totalFee = tiers.reduce((sum, t) => sum + (t.ottriFee || 0), 0);
    return totalFee / tiers.length;
  }, [tiers]);

  const scenarioBakedFee = averageBakedFee;

  const totalShare = (markupShares.A || 0) + (markupShares.B || 0) + (markupShares.C || 0);
  const sharesValid = totalShare === 100;

  const blendedMarkupTakeRate = useMemo(() => {
    if (!sharesValid) return 0;
    const markupA = (markupTiers.A || 0) * ((markupShares.A || 0) / 100);
    const markupB = (markupTiers.B || 0) * ((markupShares.B || 0) / 100);
    const markupC = (markupTiers.C || 0) * ((markupShares.C || 0) / 100);
    return markupA + markupB + markupC;
  }, [markupTiers, markupShares, sharesValid]);

  const totalBlendedTakeRate = scenarioBakedFee + blendedMarkupTakeRate;
  const expectedGrossRevenue = fundedVolume * (totalBlendedTakeRate / 100);
  const revenuePerMillion = 1000000 * (totalBlendedTakeRate / 100);

  const volumePoints = [10000000, 25000000, 50000000, 100000000];
  const revenueData = volumePoints.map((vol) => ({
    volume: vol,
    revenue: vol * (totalBlendedTakeRate / 100),
  }));

  return (
    <div className="p-4 md:p-8 space-y-8 bg-white rounded-lg shadow-xl max-w-6xl mx-auto">
      <h1
        className="text-3xl font-bold border-b pb-2 mb-4"
        style={{ color: PURPLE_5 }}
      >
        Ottri Economics Config (Page 1)
      </h1>

      {/* Intro */}
      <div
        className="border-l-4 p-4 rounded-lg"
        style={{ backgroundColor: PURPLE_1_LIGHT, borderColor: PURPLE_5 }}
      >
        <h2 className="text-xl font-semibold mb-2" style={{ color: PURPLE_5 }}>
          How to use this page
        </h2>
        <p className="text-gray-700 text-sm">
          Model and test different baked fee and merchant markup strategies
          across 4 FICO tiers. See the impact on total blended take rate and
          expected revenue based on funded volume. Baked fees typically range
          from 0–0.5% (super prime) up to 2–5% (higher risk); merchant markups
          usually fall between 1–4%.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT SIDE: CONFIG */}
        <div className="lg:col-span-2 space-y-8">
          {/* Tiers table */}
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
                  {tiers.map((tier) => (
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
                          onChange={(e) =>
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
              Soft guideline: 0.10% (T1), 0.50% (T2), 1.50% (T3), 3.50% (T4).
            </p>
          </section>

          {/* Markup strategy */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-700 flex items-center">
              Ottri Markup Strategy
              <span className="ml-2">
                <InfoTooltip content="Markup tiers are additional dealer fees charged to merchants on top of lender pricing. They do not affect lender yield directly; they are Ottri’s margin lever." />
              </span>
            </h2>

            {/* Markup tiers */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg shadow-inner">
              {['A', 'B', 'C'].map((tierKey) => (
                <div key={tierKey}>
                  <label
                    htmlFor={`markup-tier-${tierKey}`}
                    className="block text-sm font-medium text-gray-700"
                  >
                    Markup Tier {tierKey} (%)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    id={`markup-tier-${tierKey}`}
                    value={markupTiers[tierKey]}
                    onChange={(e) =>
                      handleMarkupTierChange(tierKey, e.target.value)
                    }
                    className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              ))}
            </div>

            {/* Markup shares */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg shadow-inner">
              {['A', 'B', 'C'].map((tierKey) => (
                <div key={tierKey}>
                  <label
                    htmlFor={`share-tier-${tierKey}`}
                    className="block text-sm font-medium text-gray-700"
                  >
                    Percent using Tier {tierKey}
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    id={`share-tier-${tierKey}`}
                    value={markupShares[tierKey]}
                    onChange={(e) =>
                      handleMarkupShareChange(tierKey, e.target.value)
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
                        : 'font-bold text-red-600'
                    }
                    style={{ color: sharesValid ? PURPLE_2 : undefined }}
                  >
                    {totalShare}%
                  </span>
                </p>
                {!sharesValid && (
                  <p className="text-xs text-red-500 mt-1">
                    Markup shares must sum to 100% for an accurate blended
                    rate.
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
                {blendedMarkupTakeRate.toFixed(2)}%
              </p>
            </div>
          </section>
        </div>

        {/* RIGHT SIDE: SUMMARY */}
        <div className="lg:col-span-1 space-y-8">
          {/* Summary card */}
          <section
            className="p-6 rounded-lg shadow-lg"
            style={{ backgroundColor: PURPLE_2 }}
          >
            <h2 className="text-xl font-semibold text-white mb-4">
              Blended Take Rate Summary
            </h2>
            <div className="space-y-3 text-white">
              <div className="flex justify-between items-center">
                <span className="font-medium">Average Baked Fee (%)</span>
                <span className="text-lg font-bold">
                  {scenarioBakedFee.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Blended Markup Fee (%)</span>
                <span className="text-lg font-bold">
                  {blendedMarkupTakeRate.toFixed(2)}%
                </span>
              </div>
              <div className="border-t border-purple-100 pt-3 flex justify-between items-center">
                <span className="text-xl font-extrabold">
                  Total Blended Take Rate (%)
                </span>
                <span className="text-3xl font-extrabold">
                  {totalBlendedTakeRate.toFixed(2)}%
                </span>
              </div>
            </div>
          </section>

          {/* Volume & revenue */}
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
                type="text"
                id="funded-volume"
                value={formatNumberWithCommas(fundedVolume)}
                onChange={(e) =>
                  setFundedVolume(parseNumberFromString(e.target.value))
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
        {/* Take rate composition */}
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
                    totalBlendedTakeRate
                      ? (scenarioBakedFee / totalBlendedTakeRate) * 100
                      : 0
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
                    totalBlendedTakeRate
                      ? (blendedMarkupTakeRate / totalBlendedTakeRate) * 100
                      : 0
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

            {/* Total */}
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

        {/* Revenue vs volume */}
        <section className="p-6 bg-white rounded-lg shadow-lg border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Revenue vs Funded Volume (at {totalBlendedTakeRate.toFixed(2)}% Take
            Rate)
          </h2>
          <div className="space-y-6">
            {revenueData.map((row) => (
              <div key={row.volume} className="flex flex-col">
                <div className="flex justify-between text-sm font-medium text-gray-700">
                  <span>{formatCurrency(row.volume)} Volume</span>
                  <span>{formatCurrency(row.revenue)} Revenue</span>
                </div>
                <div
                  className="mt-1 h-3 rounded-full"
                  style={{ backgroundColor: PURPLE_1_LIGHT }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        (row.volume /
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

// =====================================================
// PAGE 2: LENDERS PRODUCTS ECONOMICS
// =====================================================
const createInitialProduct = () => {
  const id =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : String(Date.now()) + Math.random().toString(16).slice(2);
  return {
    id,
    name: 'New Product',
    tier: 'Tier 1 – FICO 680–850',
    type: 'Standard',
    apr: 8.0,
    baseMDR: 0.5,
    promoMDR: 0.0,
    fundingCost: 6.0,
    lossRate: 0.5,
    servicingCost: 2.0,
    share: 100,
  };
};

const PRODUCT_TYPES = [
  'Standard',
  'Same as Cash',
  'Deferred Interest',
  'Reduced APR Promo',
  'Low Payment Promo',
];

const LendersProductsEconomics = ({ products, setProducts }) => {
  const [tierSummary, setTierSummary] = useState([]);
  const [plannedAsks, setPlannedAsks] = useState(() =>
    TIERS.reduce((acc, tier) => ({ ...acc, [tier.label]: 0 }), {})
  );
  const [optimizationSuggestion, setOptimizationSuggestion] = useState({});

  const addProduct = () => {
    setProducts((prev) => [...prev, createInitialProduct()]);
  };

  const deleteProduct = (id) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleProductChange = (id, field, value) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        if (field === 'name' || field === 'tier' || field === 'type') {
          return { ...p, [field]: value };
        }
        return { ...p, [field]: parseNumberFromString(value) };
      })
    );
  };

  const handlePlannedAskChange = (tierLabel, value) => {
    setPlannedAsks((prev) => ({
      ...prev,
      [tierLabel]: parseNumberFromString(value),
    }));
  };

  // Derived product metrics
  const calculatedProducts = useMemo(
    () =>
      products.map((p) => {
        const totalMDR = (p.baseMDR || 0) + (p.promoMDR || 0);
        const nybp =
          (p.apr || 0) +
          totalMDR -
          (p.fundingCost || 0) -
          (p.lossRate || 0) -
          (p.servicingCost || 0);
        return {
          ...p,
          totalMDR: parseFloat(totalMDR.toFixed(2)),
          nybp: parseFloat(nybp.toFixed(2)),
        };
      }),
    [products]
  );

  // Per-tier summaries
  useEffect(() => {
    const summary = TIERS.map((tierDef) => {
      const tierLabel = tierDef.label;
      const tierProducts = calculatedProducts.filter(
        (p) => p.tier === tierLabel
      );
      let totalWeightedNYBP = 0;
      let totalShare = tierProducts.reduce((sum, p) => sum + (p.share || 0), 0);

      if (totalShare <= 0) totalShare = 1;

      tierProducts.forEach((p) => {
        const weight = (p.share || 0) / totalShare;
        totalWeightedNYBP += (p.nybp || 0) * weight;
      });

      const weightedNYBP = parseFloat(totalWeightedNYBP.toFixed(2));

      let health = 'Weak';
      if (weightedNYBP >= 8) health = 'Very Strong';
      else if (weightedNYBP >= 5) health = 'Strong';
      else if (weightedNYBP >= 2) health = 'Moderate';

      const shareableYield = weightedNYBP * (1 - (tierDef.residual || 0));
      const safeAsk = shareableYield * 0.7;
      const stretchAsk = shareableYield * 0.85;

      const plannedAsk = plannedAsks[tierLabel] || 0;
      const residualAfterAsk = weightedNYBP - plannedAsk;

      let feasibility = 'Healthy';
      let color = PURPLE_2;
      if (residualAfterAsk < 1) {
        feasibility = 'Not Sustainable';
        color = MAGENTA_5;
      } else if (residualAfterAsk < 2) {
        feasibility = 'Tight – Defend Carefully';
        color = ORANGE_4;
      }

      return {
        tierLabel,
        productCount: tierProducts.length,
        weightedNYBP,
        health,
        shareableYield: parseFloat(shareableYield.toFixed(2)),
        safeAsk: parseFloat(safeAsk.toFixed(2)),
        stretchAsk: parseFloat(stretchAsk.toFixed(2)),
        plannedAsk,
        residualAfterAsk: parseFloat(residualAfterAsk.toFixed(2)),
        feasibility,
        color,
      };
    });

    setTierSummary(summary);
  }, [calculatedProducts, plannedAsks]);

  const handleSuggestOptimization = (tier) => {
    const points = [];
    if (tier.residualAfterAsk < 2) {
      points.push(
        'Consider increasing APR or MDR slightly on lower-yield products while monitoring loss & servicing assumptions.'
      );
      if (tier.plannedAsk > tier.stretchAsk) {
        points.push(
          'Reduce Ottri ask closer to the “safe” or “stretch” band so lender residual reaches at least 2.0%.'
        );
      } else {
        points.push(
          'Shift share toward products with higher NYBP to improve residual without raising APR too aggressively.'
        );
      }
    } else {
      points.push(
        'Tier already meets 2.0%+ residual. Maintain current ask and revisit only if loss performance worsens.'
      );
    }

    setOptimizationSuggestion((prev) => ({
      ...prev,
      [tier.tierLabel]: '• ' + points.join('\n• '),
    }));
  };

  return (
    <div className="p-4 md:p-8 space-y-8 bg-white rounded-lg shadow-xl max-w-6xl mx-auto">
      <h1
        className="text-3xl font-bold border-b pb-2 mb-4"
        style={{ color: PURPLE_5 }}
      >
        Lenders Products Economics (Page 2)
      </h1>

      {/* Intro */}
      <div
        className="border-l-4 p-4 rounded-lg"
        style={{ backgroundColor: PURPLE_1_LIGHT, borderColor: PURPLE_5 }}
      >
        <h2 className="text-xl font-semibold mb-2" style={{ color: PURPLE_5 }}>
          Portfolio view by tier
        </h2>
        <p className="text-gray-700 text-sm">
          Configure lender products (APR, MDR, funding cost, loss rate,
          servicing, and share). The tool calculates Net Yield Before Partner
          (NYBP) and shows how much of that yield can safely be shared with
          Ottri per FICO tier, while keeping at least 2.0% residual for the
          lender.
        </p>
      </div>

      {/* Products table */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-700">
            Product Mix & Assumptions
          </h2>
          <button
            onClick={addProduct}
            className="px-3 py-1.5 text-sm rounded-lg font-medium text-white"
            style={{ backgroundColor: PURPLE_5 }}
          >
            + Add Product
          </button>
        </div>

        <div className="overflow-x-auto bg-gray-50 rounded-lg shadow-inner">
          <table className="min-w-full text-xs md:text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-2 py-2 text-left font-medium text-gray-600">
                  Name
                </th>
                <th className="px-2 py-2 text-left font-medium text-gray-600">
                  Tier
                </th>
                <th className="px-2 py-2 text-left font-medium text-gray-600">
                  Type
                </th>
                <th className="px-2 py-2 text-left font-medium text-gray-600">
                  APR %
                </th>
                <th className="px-2 py-2 text-left font-medium text-gray-600">
                  Base MDR %
                </th>
                <th className="px-2 py-2 text-left font-medium text-gray-600">
                  Promo MDR %
                </th>
                <th className="px-2 py-2 text-left font-medium text-gray-600">
                  Funding Cost %
                </th>
                <th className="px-2 py-2 text-left font-medium text-gray-600">
                  Loss Rate %
                </th>
                <th className="px-2 py-2 text-left font-medium text-gray-600">
                  Servicing %
                </th>
                <th className="px-2 py-2 text-left font-medium text-gray-600">
                  Share %
                </th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {calculatedProducts.map((p) => (
                <tr key={p.id}>
                  <td className="px-2 py-1">
                    <input
                      type="text"
                      value={p.name}
                      onChange={(e) =>
                        handleProductChange(p.id, 'name', e.target.value)
                      }
                      className="w-32 md:w-40 p-1 border border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <select
                      value={p.tier}
                      onChange={(e) =>
                        handleProductChange(p.id, 'tier', e.target.value)
                      }
                      className="w-40 p-1 border border-gray-300 rounded"
                    >
                      {TIERS.map((t) => (
                        <option key={t.id} value={t.label}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-1">
                    <select
                      value={p.type}
                      onChange={(e) =>
                        handleProductChange(p.id, 'type', e.target.value)
                      }
                      className="w-40 p-1 border border-gray-300 rounded"
                    >
                      {PRODUCT_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      step="0.1"
                      value={p.apr}
                      onChange={(e) =>
                        handleProductChange(p.id, 'apr', e.target.value)
                      }
                      className="w-16 p-1 border border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      step="0.1"
                      value={p.baseMDR}
                      onChange={(e) =>
                        handleProductChange(p.id, 'baseMDR', e.target.value)
                      }
                      className="w-16 p-1 border border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      step="0.1"
                      value={p.promoMDR}
                      onChange={(e) =>
                        handleProductChange(p.id, 'promoMDR', e.target.value)
                      }
                      className="w-16 p-1 border border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      step="0.1"
                      value={p.fundingCost}
                      onChange={(e) =>
                        handleProductChange(
                          p.id,
                          'fundingCost',
                          e.target.value
                        )
                      }
                      className="w-16 p-1 border border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      step="0.1"
                      value={p.lossRate}
                      onChange={(e) =>
                        handleProductChange(p.id, 'lossRate', e.target.value)
                      }
                      className="w-16 p-1 border border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      step="0.1"
                      value={p.servicingCost}
                      onChange={(e) =>
                        handleProductChange(
                          p.id,
                          'servicingCost',
                          e.target.value
                        )
                      }
                      className="w-16 p-1 border border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      step="1"
                      value={p.share}
                      onChange={(e) =>
                        handleProductChange(p.id, 'share', e.target.value)
                      }
                      className="w-16 p-1 border border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-2 py-1 text-right">
                    <button
                      onClick={() => deleteProduct(p.id)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {calculatedProducts.length === 0 && (
                <tr>
                  <td
                    colSpan={11}
                    className="px-4 py-4 text-center text-gray-500 text-sm"
                  >
                    No products yet. Click “Add Product” to start modeling.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-600">
          NYBP = APR + (Base MDR + Promo MDR) – Funding Cost – Loss Rate – Servicing Cost.
        </p>
      </section>

      {/* Tier summaries */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-700">
          Tier Yield Sharing & Residual Health
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tierSummary.map((tier) => (
            <div
              key={tier.tierLabel}
              className="p-4 rounded-lg shadow border border-gray-200 bg-white space-y-2"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold text-gray-800">
                  {tier.tierLabel}
                </h3>
                <span className="text-xs text-gray-500">
                  {tier.productCount} product
                  {tier.productCount === 1 ? '' : 's'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-gray-500">Weighted NYBP</div>
                  <div className="font-semibold">
                    {tier.weightedNYBP.toFixed(2)}%
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Health</div>
                  <div className="font-semibold">{tier.health}</div>
                </div>
                <div>
                  <div className="text-gray-500">Shareable Yield</div>
                  <div className="font-semibold">
                    {tier.shareableYield.toFixed(2)}%
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Safe Ask</div>
                  <div className="font-semibold">
                    {tier.safeAsk.toFixed(2)}%
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Stretch Ask</div>
                  <div className="font-semibold">
                    {tier.stretchAsk.toFixed(2)}%
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Planned Ottri Ask</div>
                  <input
                    type="number"
                    step="0.1"
                    value={tier.plannedAsk}
                    onChange={(e) =>
                      handlePlannedAskChange(
                        tier.tierLabel,
                        e.target.value
                      )
                    }
                    className="mt-0.5 w-full p-1 border border-gray-300 rounded"
                  />
                </div>
              </div>

              <div className="mt-1 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">
                    Lender Residual After Ask
                  </span>
                  <span
                    className="font-semibold"
                    style={{ color: tier.color }}
                  >
                    {tier.residualAfterAsk.toFixed(2)}% – {tier.feasibility}
                  </span>
                </div>
              </div>

              <div className="mt-2 flex justify-between items-center">
                <button
                  onClick={() => handleSuggestOptimization(tier)}
                  className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
                >
                  Suggest Optimization
                </button>
              </div>

              {optimizationSuggestion[tier.tierLabel] && (
                <div className="mt-2 p-2 bg-gray-50 rounded border border-dashed border-gray-300 text-xs text-gray-700 whitespace-pre-line">
                  {optimizationSuggestion[tier.tierLabel]}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

// =====================================================
// ROOT APP WITH SIMPLE TABS
// =====================================================
const App = () => {
  const [activePage, setActivePage] = useState('page1');
  const [tiers, setTiers] = useState(TIERS);
  const [markupTiers, setMarkupTiers] = useState({ A: 1.0, B: 2.0, C: 3.0 });
  const [markupShares, setMarkupShares] = useState({ A: 40, B: 30, C: 30 });
  const [fundedVolume, setFundedVolume] = useState(50000000);
  const [products, setProducts] = useState([createInitialProduct()]);

  return (
    <div className="w-full">
      {/* Tabs */}
      <div className="max-w-6xl mx-auto mb-4">
        <div className="inline-flex rounded-lg bg-white shadow">
          <button
            onClick={() => setActivePage('page1')}
            className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
              activePage === 'page1'
                ? 'bg-purple-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Page 1 – Ottri Economics
          </button>
          <button
            onClick={() => setActivePage('page2')}
            className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
              activePage === 'page2'
                ? 'bg-purple-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Page 2 – Lenders Products
          </button>
        </div>
      </div>

      {activePage === 'page1' ? (
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
      ) : (
        <LendersProductsEconomics
          products={products}
          setProducts={setProducts}
        />
      )}
    </div>
  );
};

// Mount app
const rootEl = document.getElementById('root');
const root = ReactDOM.createRoot(rootEl);
root.render(<App />);
