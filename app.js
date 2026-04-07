const PRIMARY_API_URL = "https://api.nqminkhuy.com/docs/OtherAPI/Gold-Price/";
const LOCAL_API_CANDIDATES = [
  "../docs/OtherAPI/Gold-Price/",
  "/docs/OtherAPI/Gold-Price/",
];
const LEGACY_API_URL = "https://api.nqminkhuy.com/docs/OtherAPI/Gold-Price/";
const API_CANDIDATES = [PRIMARY_API_URL, ...LOCAL_API_CANDIDATES, LEGACY_API_URL];

const REFRESH_INTERVAL_MS = 60_000;

const PRODUCT_TYPE_LABELS = {
  MIENG: "Vàng miếng",
  NHAN: "Nhẫn", 
  TRANGSUC: "Trang sức",
  VANGTRANG: "Vàng trắng",
};

const priceBodyEl = document.querySelector("#price-body");
const statusTextEl = document.querySelector("#status-text");
const statusBadgeEl = document.querySelector("#status-badge");
const refreshBtnEl = document.querySelector("#refresh-btn");
const updateTimeEl = document.querySelector("#update-time");

const sourceLinkEl = document.querySelector("#source-link");
const sourceHostEl = document.querySelector("#source-host");
const sourcePreviewHostEl = document.querySelector("#source-preview-host");
const sourceNoteEl = document.querySelector("#source-note");

const trackedCountEl = document.querySelector("#tracked-count");
const heroTrackedCountEl = document.querySelector("#hero-tracked-count");
const trackedUnitEl = document.querySelector("#tracked-unit");
const nextRefreshEl = document.querySelector("#next-refresh");

const searchInputEl = document.querySelector("#search-input");
const sortSelectEl = document.querySelector("#sort-select");
const tableContextEl = document.querySelector("#table-context");
const tableUnitEl = document.querySelector("#table-unit");

const maxBuyEl = document.querySelector("#max-buy");
const maxBuyTypeEl = document.querySelector("#max-buy-type");
const minSellEl = document.querySelector("#min-sell");
const minSellTypeEl = document.querySelector("#min-sell-type");
const avgSpreadEl = document.querySelector("#avg-spread");
const avgSpreadNoteEl = document.querySelector("#avg-spread-note");
const largestSpreadEl = document.querySelector("#largest-spread");
const largestSpreadTypeEl = document.querySelector("#largest-spread-type");

const featuredTypeEl = document.querySelector("#featured-type");
const featuredRangeEl = document.querySelector("#featured-range");
const featuredCopyEl = document.querySelector("#featured-copy");

const calcTypeEl = document.querySelector("#calc-type");
const calcAmountEl = document.querySelector("#calc-amount");
const calcUnitEl = document.querySelector("#calc-unit");
const calcPriceEl = document.querySelector("#calc-price");
const calcTotalEl = document.querySelector("#calc-total");
const calcHintEl = document.querySelector("#calc-hint");

let latestPrices = [];
let latestMeta = {
  exchangeCount: 0,
  itemCount: 0,
  mode: "",
  updateTimeDisplay: "",
};
let latestUnit = "VND/luong";
let latestSourceUrl = PRIMARY_API_URL;
let latestEndpointUrl = PRIMARY_API_URL;
let nextRefreshAt = Date.now() + REFRESH_INTERVAL_MS;
let isFetching = false;

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function formatMillionFromVnd(value) {
  if (!Number.isFinite(value)) {
    return "--";
  }

  return new Intl.NumberFormat("vi-VN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 1_000_000);
}

function formatAmount(value) {
  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 3,
  }).format(value);
}

function formatDateTime(value) {
  const timestamp = Number(value);
  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    return "";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(timestamp));
}

function parseAmountInput(rawValue) {
  if (typeof rawValue !== "string") {
    return null;
  }

  const normalized = rawValue.replace(/\s+/g, "").replace(",", ".").trim();
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function getVndMultiplier(unit) {
  const normalized = normalizeText(unit).toLowerCase();

  if (normalized.includes("nghìn") || normalized.includes("nghin")) {
    return 1000;
  }

  if (normalized.includes("triệu") || normalized.includes("trieu")) {
    return 1_000_000;
  }

  return 1;
}

function getUnitBaseLabel(sourceUnit) {
  const raw = normalizeText(sourceUnit);
  const extracted = raw.includes("/") ? raw.split("/").pop().trim() : raw;
  const normalized = extracted.toLowerCase().replace(/\s+/g, "");

  if (normalized.includes("luong")) {
    return "lượng";
  }

  if (normalized.includes("chi")) {
    return "chỉ";
  }

  if (normalized.includes("cay")) {
    return "cây";
  }

  if (normalized.includes("ounce") || normalized.includes("oz")) {
    return "ounce";
  }

  return extracted || "lượng";
}

function getDisplayUnit(sourceUnit) {
  return `triệu đồng / ${getUnitBaseLabel(sourceUnit)}`;
}

function formatMillionFromSource(value, sourceUnit) {
  return formatMillionFromVnd(value * getVndMultiplier(sourceUnit));
}

function toNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const sanitized = value.trim().replace(/\s+/g, "").replace(/[^\d.,-]/g, "");
  if (!sanitized) {
    return null;
  }

  if (sanitized.includes(".") && sanitized.includes(",")) {
    if (sanitized.lastIndexOf(",") > sanitized.lastIndexOf(".")) {
      const decimalValue = Number(sanitized.replace(/\./g, "").replace(",", "."));
      return Number.isFinite(decimalValue) ? decimalValue : null;
    }

    const groupedValue = Number(sanitized.replace(/,/g, ""));
    return Number.isFinite(groupedValue) ? groupedValue : null;
  }

  if (sanitized.includes(".")) {
    const dotGroups = sanitized.split(".");
    if (dotGroups.length > 1 && dotGroups.slice(1).every((group) => group.length === 3)) {
      const groupedValue = Number(dotGroups.join(""));
      return Number.isFinite(groupedValue) ? groupedValue : null;
    }
  }

  if (sanitized.includes(",")) {
    const commaGroups = sanitized.split(",");
    if (commaGroups.length > 1 && commaGroups.slice(1).every((group) => group.length === 3)) {
      const groupedValue = Number(commaGroups.join(""));
      return Number.isFinite(groupedValue) ? groupedValue : null;
    }

    const decimalValue = Number(sanitized.replace(",", "."));
    return Number.isFinite(decimalValue) ? decimalValue : null;
  }

  const parsed = Number(sanitized);
  return Number.isFinite(parsed) ? parsed : null;
}

function getProductTypeLabel(productType) {
  const normalized = normalizeText(productType).toUpperCase();
  return PRODUCT_TYPE_LABELS[normalized] || normalizeText(productType);
}

function buildPriceKey(item, fallbackIndex) {
  if (item && item.id !== undefined && item.id !== null) {
    return `id:${item.id}`;
  }

  if (normalizeText(item?.slug)) {
    return `slug:${normalizeText(item.slug)}`;
  }

  if (normalizeText(item?.ticker_buy)) {
    return `ticker:${normalizeText(item.ticker_buy)}`;
  }

  if (normalizeText(item?.type)) {
    return `type:${normalizeText(item.type)}`;
  }

  if (normalizeText(item?.name)) {
    return `name:${normalizeText(item.name)}`;
  }

  return `row:${fallbackIndex}`;
}

function normalizePrices(rawPrices) {
  if (!Array.isArray(rawPrices)) {
    return [];
  }

  return rawPrices
    .map((item, index) => {
      const type = normalizeText(item?.type) || normalizeText(item?.name);
      const buy = toNumber(item?.price_buy ?? item?.buy_clean ?? item?.buy);
      const sell = toNumber(item?.price_sell ?? item?.sell_clean ?? item?.sell);

      if (!type || buy === null || sell === null) {
        return null;
      }

      const exchangeName = normalizeText(item?.exchange_name) || normalizeText(item?.exchange);
      const exchangeCode = normalizeText(item?.exchange);
      const productType = normalizeText(item?.product_type);
      const karatType = normalizeText(item?.karat_type);
      const productTypeLabel = getProductTypeLabel(productType);
      const metaText = [exchangeName, productTypeLabel, karatType].filter(Boolean).join(" • ");
      const spread = toNumber(item?.spread ?? item?.sell_buy_chg);

      return {
        key: buildPriceKey(item, index),
        type,
        buy,
        sell,
        spread: Number.isFinite(spread) ? spread : sell - buy,
        exchangeName,
        exchangeCode,
        productType,
        productTypeLabel,
        karatType,
        metaText,
        lastUpdatedDate: normalizeText(item?.last_updated_date),
        lastUpdatedTime: normalizeText(item?.last_updated_time),
        modifiedTime: toNumber(item?.modified_time) ?? 0,
      };
    })
    .filter(Boolean);
}

function getSpread(item) {
  if (Number.isFinite(item?.spread)) {
    return item.spread;
  }

  return item.sell - item.buy;
}

function getMetrics(prices) {
  if (!prices.length) {
    return null;
  }

  const maxBuy = prices.reduce((best, item) => (item.buy > best.buy ? item : best), prices[0]);
  const minSell = prices.reduce((best, item) => (item.sell < best.sell ? item : best), prices[0]);
  const widestSpread = prices.reduce(
    (best, item) => (getSpread(item) > getSpread(best) ? item : best),
    prices[0]
  );
  const totalSpread = prices.reduce((sum, item) => sum + getSpread(item), 0);

  return {
    maxBuy,
    minSell,
    widestSpread,
    avgSpread: Math.round(totalSpread / prices.length),
  };
}

function getResponseUpdateTime(data, prices) {
  const explicitUpdateTime = normalizeText(data?.update_time);
  if (explicitUpdateTime) {
    return explicitUpdateTime;
  }

  const fetchedAt = normalizeText(data?.fetched_at);
  if (fetchedAt) {
    return `Đồng bộ lúc ${fetchedAt}`;
  }

  const freshestPrice = prices.reduce(
    (best, item) => (item.modifiedTime > (best?.modifiedTime || 0) ? item : best),
    null
  );
  const latestStampedText = [freshestPrice?.lastUpdatedTime, freshestPrice?.lastUpdatedDate]
    .filter(Boolean)
    .join(" ");
  if (latestStampedText) {
    return `Nguồn báo giá ${latestStampedText}`;
  }

  const latestModifiedTime = toNumber(data?.latest_modified_time);
  if (latestModifiedTime !== null && latestModifiedTime > 0) {
    return `Đồng bộ lúc ${formatDateTime(latestModifiedTime)}`;
  }

  return formatFallbackTime();
}

function getResponseMeta(data, prices) {
  return {
    exchangeCount: toNumber(data?.exchange_count) ?? 0,
    itemCount: toNumber(data?.type_count) ?? prices.length,
    mode: normalizeText(data?.mode),
    updateTimeDisplay: getResponseUpdateTime(data, prices),
  };
}

function setStatus(message, state = "loading") {
  statusTextEl.textContent = message;
  statusTextEl.classList.remove("is-loading", "is-success", "is-error");
  statusTextEl.classList.add(`is-${state}`);

  statusBadgeEl.dataset.state = state;
  if (state === "success") {
    statusBadgeEl.textContent = "Live";
  } else if (state === "error") {
    statusBadgeEl.textContent = "Lỗi";
  } else {
    statusBadgeEl.textContent = "Đang tải";
  }
}

function clearSummary() {
  const displayUnit = getDisplayUnit(latestUnit);

  maxBuyEl.textContent = "--";
  maxBuyTypeEl.textContent = "Đang chờ dữ liệu";
  minSellEl.textContent = "--";
  minSellTypeEl.textContent = "Đang chờ dữ liệu";
  avgSpreadEl.textContent = "--";
  avgSpreadNoteEl.textContent = displayUnit;
  largestSpreadEl.textContent = "--";
  largestSpreadTypeEl.textContent = "Đang chờ dữ liệu";
  featuredTypeEl.textContent = "--";
  featuredRangeEl.textContent = "--";
  featuredCopyEl.textContent = "Khi có dữ liệu, mục này sẽ tóm tắt loại vàng đáng chú ý nhất để bạn so nhanh.";

  trackedCountEl.textContent = "--";
  heroTrackedCountEl.textContent = "--";
  trackedUnitEl.textContent = "--";
  tableUnitEl.textContent = "Đang chờ dữ liệu đơn vị.";
}

function renderSummary(prices, unit) {
  const metrics = getMetrics(prices);
  const displayUnit = getDisplayUnit(unit || latestUnit);

  if (!metrics) {
    clearSummary();
    return;
  }

  maxBuyEl.textContent = formatMillionFromSource(metrics.maxBuy.buy, unit);
  maxBuyTypeEl.textContent = metrics.maxBuy.type;

  minSellEl.textContent = formatMillionFromSource(metrics.minSell.sell, unit);
  minSellTypeEl.textContent = metrics.minSell.type;

  avgSpreadEl.textContent = formatMillionFromSource(metrics.avgSpread, unit);
  avgSpreadNoteEl.textContent = displayUnit;

  largestSpreadEl.textContent = formatMillionFromSource(getSpread(metrics.widestSpread), unit);
  largestSpreadTypeEl.textContent = metrics.widestSpread.type;

  featuredTypeEl.textContent = metrics.minSell.type;
  featuredRangeEl.textContent = `Bán ra thấp nhất: ${formatMillionFromSource(metrics.minSell.sell, unit)} ${displayUnit}`;
  featuredCopyEl.textContent = metrics.minSell.exchangeName
    ? `${metrics.minSell.exchangeName} đang là điểm tham chiếu bán ra thấp nhất. Chênh lệch hiện tại khoảng ${formatMillionFromSource(getSpread(metrics.minSell), unit)} ${displayUnit}.`
    : `Loại vàng này đang là mốc bán ra thấp nhất. Chênh lệch hiện tại khoảng ${formatMillionFromSource(getSpread(metrics.minSell), unit)} ${displayUnit}.`;

  const itemCount = latestMeta.itemCount || prices.length;
  const exchangeCount = latestMeta.exchangeCount || 0;
  trackedCountEl.textContent = exchangeCount ? `${itemCount} mã / ${exchangeCount} thương hiệu` : `${itemCount} mã`;
  heroTrackedCountEl.textContent = exchangeCount ? `${itemCount} sản phẩm từ ${exchangeCount} thương hiệu` : `${itemCount} loại vàng`;
  trackedUnitEl.textContent = displayUnit;
  tableUnitEl.textContent = exchangeCount
    ? `Quy đổi hiển thị: ${displayUnit}. Dữ liệu từ ${exchangeCount} thương hiệu.`
    : `Quy đổi hiển thị: ${displayUnit}.`;
}

function getHostLabel(url) {
  try {
    return new URL(url, window.location.href).host || window.location.host || "Không xác định";
  } catch (_error) {
    return url || "Không xác định";
  }
}

function resolveUrl(url) {
  try {
    return new URL(url, window.location.href).href;
  } catch (_error) {
    return url;
  }
}

function isMatchingUrl(urlA, urlB) {
  return resolveUrl(urlA) === resolveUrl(urlB);
}

function getEndpointNote(endpointUrl) {
  const scopeSuffix = latestMeta.exchangeCount ? ` ${latestMeta.exchangeCount} thương hiệu.` : "";

  if (isMatchingUrl(endpointUrl, PRIMARY_API_URL)) {
    return `Đang dùng API JSON mới từ nqminkhuy.com.${scopeSuffix}`;
  }

  if (LOCAL_API_CANDIDATES.some((candidate) => isMatchingUrl(endpointUrl, candidate))) {
    return `API chính lỗi, đang dùng fallback nội bộ.${scopeSuffix}`;
  }

  if (isMatchingUrl(endpointUrl, LEGACY_API_URL)) {
    return `API chính lỗi, đang dùng endpoint legacy tương thích.${scopeSuffix}`;
  }

  return `Đang dùng nguồn thay thế.${scopeSuffix}`;
}

function renderSourceInfo(sourceUrl, endpointUrl) {
  const host = getHostLabel(sourceUrl || endpointUrl || PRIMARY_API_URL);
  sourceLinkEl.href = sourceUrl || endpointUrl || PRIMARY_API_URL;
  sourceHostEl.textContent = host;
  sourcePreviewHostEl.textContent = host;
  sourceNoteEl.textContent = getEndpointNote(endpointUrl);
}

function renderEmptyRow(message) {
  priceBodyEl.innerHTML = "";

  const row = document.createElement("tr");
  const cell = document.createElement("td");
  cell.colSpan = 5;
  cell.className = "empty-row";
  cell.textContent = message;
  row.appendChild(cell);
  priceBodyEl.appendChild(row);
}

function createIndexCell(index) {
  const cell = document.createElement("td");
  cell.className = "rank-cell";
  cell.textContent = String(index).padStart(2, "0");
  return cell;
}

function createTypeCell(item, badges) {
  const cell = document.createElement("td");
  cell.className = "type-cell";

  const block = document.createElement("div");
  block.className = "type-block";

  const name = document.createElement("span");
  name.className = "type-name";
  name.textContent = item.type;
  block.appendChild(name);

  if (item.metaText) {
    const meta = document.createElement("span");
    meta.className = "type-meta";
    meta.textContent = item.metaText;
    block.appendChild(meta);
  }

  if (badges.length) {
    const badgeWrap = document.createElement("div");
    badgeWrap.className = "type-badges";

    for (const badge of badges) {
      const badgeEl = document.createElement("span");
      badgeEl.className = `type-badge ${badge.className}`;
      badgeEl.textContent = badge.label;
      badgeWrap.appendChild(badgeEl);
    }

    block.appendChild(badgeWrap);
  }

  cell.appendChild(block);
  return cell;
}

function createNumberCell(text, className = "") {
  const cell = document.createElement("td");
  cell.className = className ? `number-cell ${className}` : "number-cell";
  cell.textContent = text;
  return cell;
}

function getBadges(item, metrics) {
  if (!metrics) {
    return [];
  }

  const badges = [];

  if (item.type === metrics.maxBuy.type && item.buy === metrics.maxBuy.buy) {
    badges.push({ label: "Mua cao", className: "is-buy" });
  }

  if (item.type === metrics.minSell.type && item.sell === metrics.minSell.sell) {
    badges.push({ label: "Bán thấp", className: "is-sell" });
  }

  if (item.type === metrics.widestSpread.type && getSpread(item) === getSpread(metrics.widestSpread)) {
    badges.push({ label: "Biên độ rộng", className: "is-spread" });
  }

  return badges;
}

function getSortLabel(value) {
  switch (value) {
    case "buy-desc":
      return "mua vào cao nhất";
    case "sell-asc":
      return "bán ra thấp nhất";
    case "spread-desc":
      return "chênh lệch lớn nhất";
    case "name-asc":
      return "tên A-Z";
    default:
      return "mặc định";
  }
}

function getSearchHaystack(item) {
  return [
    item.type,
    item.exchangeName,
    item.exchangeCode,
    item.productType,
    item.productTypeLabel,
    item.karatType,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function getFilteredAndSortedPrices(prices) {
  const query = searchInputEl.value.trim().toLowerCase();
  const items = query
    ? prices.filter((item) => getSearchHaystack(item).includes(query))
    : prices.slice();

  switch (sortSelectEl.value) {
    case "buy-desc":
      items.sort((a, b) => b.buy - a.buy);
      break;
    case "sell-asc":
      items.sort((a, b) => a.sell - b.sell);
      break;
    case "spread-desc":
      items.sort((a, b) => getSpread(b) - getSpread(a));
      break;
    case "name-asc":
      items.sort((a, b) => a.type.localeCompare(b.type, "vi"));
      break;
    default:
      break;
  }

  return items;
}

function renderTableContext(filteredCount, totalCount) {
  const query = searchInputEl.value.trim();
  const exchangeSuffix = latestMeta.exchangeCount ? ` từ ${latestMeta.exchangeCount} thương hiệu` : "";

  if (!totalCount) {
    tableContextEl.textContent = "Chưa có dữ liệu thị trường để hiển thị.";
    return;
  }

  if (query && !filteredCount) {
    tableContextEl.textContent = `Không tìm thấy kết quả phù hợp cho "${query}".`;
    return;
  }

  if (query) {
    tableContextEl.textContent = `Hiển thị ${filteredCount}/${totalCount} kết quả${exchangeSuffix} cho "${query}", sắp xếp: ${getSortLabel(sortSelectEl.value)}.`;
    return;
  }

  tableContextEl.textContent = `Hiển thị ${filteredCount}/${totalCount} mã vàng${exchangeSuffix}, sắp xếp: ${getSortLabel(sortSelectEl.value)}.`;
}

function renderTable(prices, unit) {
  const metrics = getMetrics(latestPrices);
  const query = searchInputEl.value.trim();
  priceBodyEl.innerHTML = "";

  if (!latestPrices.length) {
    renderEmptyRow("Tạm thời chưa có dữ liệu giá vàng.");
    return;
  }

  if (!prices.length) {
    renderEmptyRow(query ? `Không có kết quả cho "${query}".` : "Không có dữ liệu giá vàng.");
    return;
  }

  for (const [index, item] of prices.entries()) {
    const row = document.createElement("tr");
    if (calcTypeEl.value && calcTypeEl.value === item.key) {
      row.classList.add("is-selected");
    }

    row.appendChild(createIndexCell(index + 1));
    row.appendChild(createTypeCell(item, getBadges(item, metrics)));
    row.appendChild(createNumberCell(formatMillionFromSource(item.buy, unit)));
    row.appendChild(createNumberCell(formatMillionFromSource(item.sell, unit)));
    row.appendChild(createNumberCell(formatMillionFromSource(getSpread(item), unit), "spread-cell"));

    priceBodyEl.appendChild(row);
  }
}

function getCalculatorOptionLabel(item) {
  return item.exchangeName ? `${item.type} • ${item.exchangeName}` : item.type;
}

function populateCalculatorTypes(prices) {
  const previousType = calcTypeEl.value;
  calcTypeEl.innerHTML = "";

  if (!prices.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Chưa có dữ liệu";
    calcTypeEl.appendChild(option);
    calcTypeEl.disabled = true;
    return;
  }

  calcTypeEl.disabled = false;

  for (const item of prices) {
    const option = document.createElement("option");
    option.value = item.key;
    option.textContent = getCalculatorOptionLabel(item);
    calcTypeEl.appendChild(option);
  }

  const stillExists = prices.some((item) => item.key === previousType);
  calcTypeEl.value = stillExists ? previousType : prices[0].key;
}

function updateCalculator() {
  if (!latestPrices.length) {
    calcPriceEl.textContent = "--";
    calcTotalEl.textContent = "--";
    calcHintEl.textContent = "Chưa đủ dữ liệu để tính.";
    return;
  }

  const selectedKey = calcTypeEl.value;
  const selectedGold = latestPrices.find((item) => item.key === selectedKey) || latestPrices[0];
  const amount = parseAmountInput(calcAmountEl.value);
  const unit = calcUnitEl.value;
  const multiplier = getVndMultiplier(latestUnit);
  const sellPriceVndPerCay = selectedGold.sell * multiplier;

  calcPriceEl.textContent = `${formatMillionFromVnd(sellPriceVndPerCay)} triệu đồng / cây`;

  if (amount === null || amount <= 0) {
    calcTotalEl.textContent = "--";
    calcHintEl.textContent = "Vui lòng nhập số lượng lớn hơn 0.";
    return;
  }

  const quantityInCay = unit === "chi" ? amount / 10 : amount;
  const totalCostVnd = quantityInCay * sellPriceVndPerCay;
  const unitLabel = unit === "chi" ? "chỉ" : "cây";
  const productLabel = selectedGold.exchangeName
    ? `${selectedGold.type} (${selectedGold.exchangeName})`
    : selectedGold.type;

  calcTotalEl.textContent = `${formatMillionFromVnd(totalCostVnd)} triệu đồng`;
  calcHintEl.textContent = `${formatAmount(amount)} ${unitLabel} ${productLabel} theo giá bán ra hiện tại.`;
}

function renderMarketView() {
  renderSummary(latestPrices, latestUnit);

  const filteredPrices = getFilteredAndSortedPrices(latestPrices);
  renderTable(filteredPrices, latestUnit);
  renderTableContext(filteredPrices.length, latestPrices.length);
}

function formatCountdown(seconds) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remain = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remain).padStart(2, "0")}`;
}

function renderRefreshCountdown() {
  const remainingSeconds = Math.ceil(Math.max(0, nextRefreshAt - Date.now()) / 1000);
  nextRefreshEl.textContent = formatCountdown(remainingSeconds);
}

function formatFallbackTime() {
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());
}

async function fetchJsonFromEndpoint(url) {
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  const normalizedPrices = normalizePrices(data?.prices);

  if (!data || data.success !== true || !normalizedPrices.length) {
    throw new Error("API trả về dữ liệu không hợp lệ hoặc rỗng");
  }

  return { data, normalizedPrices };
}

async function fetchPrices() {
  if (isFetching) {
    return;
  }

  isFetching = true;
  refreshBtnEl.disabled = true;
  setStatus("Đang tải dữ liệu mới...", "loading");

  let lastError = null;

  try {
    for (const endpointUrl of API_CANDIDATES) {
      try {
        const { data, normalizedPrices } = await fetchJsonFromEndpoint(endpointUrl);

        latestPrices = normalizedPrices;
        latestMeta = getResponseMeta(data, normalizedPrices);
        latestUnit = data.unit || latestUnit;
        latestSourceUrl = data.source || endpointUrl;
        latestEndpointUrl = endpointUrl;

        populateCalculatorTypes(normalizedPrices);
        renderMarketView();
        updateCalculator();
        renderSourceInfo(latestSourceUrl, latestEndpointUrl);

        updateTimeEl.textContent = latestMeta.updateTimeDisplay || formatFallbackTime();
        setStatus(`Đã cập nhật ${normalizedPrices.length} mã vàng`, "success");
        nextRefreshAt = Date.now() + REFRESH_INTERVAL_MS;
        renderRefreshCountdown();
        return;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error("Không thể lấy dữ liệu từ mọi endpoint");
  } catch (error) {
    console.error(error);
    setStatus("Không thể lấy dữ liệu. Vui lòng thử lại sau.", "error");

    if (!latestPrices.length) {
      clearSummary();
      renderEmptyRow("Tạm thời không lấy được dữ liệu giá vàng.");
      renderTableContext(0, 0);
    }

    nextRefreshAt = Date.now() + REFRESH_INTERVAL_MS;
    renderRefreshCountdown();
  } finally {
    refreshBtnEl.disabled = false;
    isFetching = false;
  }
}

refreshBtnEl.addEventListener("click", fetchPrices);
searchInputEl.addEventListener("input", renderMarketView);
sortSelectEl.addEventListener("change", renderMarketView);
calcTypeEl.addEventListener("change", () => {
  updateCalculator();
  renderMarketView();
});
calcAmountEl.addEventListener("input", updateCalculator);
calcUnitEl.addEventListener("change", updateCalculator);

renderRefreshCountdown();
fetchPrices();
window.setInterval(fetchPrices, REFRESH_INTERVAL_MS);
window.setInterval(renderRefreshCountdown, 1000);
