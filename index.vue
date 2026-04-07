<template>
  <div class="gold-market-page">
    <div class="market-shell">
      <aside class="market-aside">
        <nav class="aside-nav" aria-label="Điều hướng nhanh">
          <a href="#tong-quan" class="aside-link">Tổng quan</a>
          <a href="#bang-gia" class="aside-link">Bảng giá</a>
          <a href="#spotlight" class="aside-link">Spotlight</a>
          <a href="#cong-cu" class="aside-link">Công cụ</a>
        </nav>

        <section class="aside-card pulse-card" aria-live="polite">
          <div class="aside-card-head">
            <p class="section-label">Trạng thái</p>
            <span id="status-badge" class="pulse-chip" data-state="loading">Đang tải</span>
          </div>

          <div class="status-row">
            <span class="live-dot" aria-hidden="true"></span>
            <p id="status-text" class="status-text is-loading">Đang đồng bộ dữ liệu...</p>
          </div>

          <dl class="pulse-list">
            <div>
              <dt>Sản phẩm</dt>
              <dd id="tracked-count">--</dd>
            </div>
            <div>
              <dt>Đơn vị</dt>
              <dd id="tracked-unit">--</dd>
            </div>
            <div>
              <dt>Làm mới sau</dt>
              <dd id="next-refresh">01:00</dd>
            </div>
          </dl>

          <button id="refresh-btn" class="action-btn" type="button">Làm mới ngay</button>
        </section>
      </aside>

      <main class="market-main">
        <header class="hero-panel panel" id="tong-quan">
          <div class="hero-copy">
            <p class="hero-kicker">@raintee.dev</p>
            <h1>Giá vàng trong nước</h1>
            <p class="hero-description">
              Theo dõi mua vào, bán ra, chênh lệch và ước tính chi phí mua bán chỉ trong một bảng điều khiển &gt;&lt;
            </p>
          </div>

          <div class="hero-meta-grid" aria-label="Thông tin nhanh">
            <article class="hero-meta-card">
              <p class="hero-meta-label">Cập nhật gần nhất</p>
              <p id="update-time" class="hero-meta-value">Chưa có dữ liệu cập nhật</p>
            </article>
            <article class="hero-meta-card">
              <p class="hero-meta-label">Loại vàng đang theo dõi</p>
              <p id="hero-tracked-count" class="hero-meta-value">--</p>
            </article>
            <article class="hero-meta-card">
              <p class="hero-meta-label">Tốc độ làm mới</p>
              <p class="hero-meta-value">60 giây / lần</p>
            </article>
          </div>
        </header>

        <section class="stat-grid" aria-label="Tóm tắt thị trường">
          <article class="stat-card panel">
            <p class="section-label">Mua vào cao nhất</p>
            <p id="max-buy" class="stat-value">--</p>
            <p id="max-buy-type" class="stat-note">Đang chờ dữ liệu</p>
          </article>

          <article class="stat-card panel">
            <p class="section-label">Bán ra thấp nhất</p>
            <p id="min-sell" class="stat-value">--</p>
            <p id="min-sell-type" class="stat-note">Đang chờ dữ liệu</p>
          </article>

          <article class="stat-card panel">
            <p class="section-label">Chênh lệch trung bình</p>
            <p id="avg-spread" class="stat-value">--</p>
            <p id="avg-spread-note" class="stat-note">triệu đồng / lượng</p>
          </article>

          <article class="stat-card panel">
            <p class="section-label">Biên độ lớn nhất</p>
            <p id="largest-spread" class="stat-value">--</p>
            <p id="largest-spread-type" class="stat-note">Đang chờ dữ liệu</p>
          </article>
        </section>

        <div class="content-grid">
          <div class="content-main">
            <section class="panel board-panel" id="bang-gia">
              <div class="panel-head">
                <div>
                  <p class="section-label">Market Board</p>
                  <h2 class="panel-title">Bảng giá trực tiếp</h2>
                </div>

                <div class="board-tools">
                  <label class="search-field" for="search-input">
                    <span class="search-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M21 21L16.65 16.65M10.75 18.5C15.03 18.5 18.5 15.03 18.5 10.75C18.5 6.47 15.03 3 10.75 3C6.47 3 3 6.47 3 10.75C3 15.03 6.47 18.5 10.75 18.5Z"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    </span>
                    <input id="search-input" type="search" placeholder="Tìm loại vàng..." autocomplete="off" />
                  </label>

                  <div class="select-wrap sort-wrap">
                    <select id="sort-select" aria-label="Sắp xếp bảng giá">
                      <option value="default">Mặc định</option>
                      <option value="buy-desc">Mua vào cao nhất</option>
                      <option value="sell-asc">Bán ra thấp nhất</option>
                      <option value="spread-desc">Chênh lệch lớn nhất</option>
                      <option value="name-asc">Tên A-Z</option>
                    </select>
                  </div>
                </div>
              </div>

              <div class="board-subhead">
                <p id="table-context" class="table-context">Đang chuẩn bị bảng dữ liệu...</p>
                <p id="table-unit" class="table-unit">Đang chờ dữ liệu đơn vị.</p>
              </div>

              <div class="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>STT</th>
                      <th>Loại vàng</th>
                      <th>Mua vào</th>
                      <th>Bán ra</th>
                      <th>Chênh lệch</th>
                    </tr>
                  </thead>
                  <tbody id="price-body">
                    <tr>
                      <td colspan="5" class="empty-row">Đang lấy dữ liệu...</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section class="panel spotlight-panel" id="spotlight">
              <div class="panel-head panel-head-compact">
                <div>
                  <p class="section-label">Spotlight</p>
                  <h2 class="panel-title">Điểm nổi bật thị trường</h2>
                </div>
              </div>

              <div class="spotlight-grid">
                <article class="spotlight-feature">
                  <p class="spotlight-tag">Mốc tham chiếu nhanh</p>
                  <h3 id="featured-type">--</h3>
                  <p id="featured-range" class="spotlight-range">--</p>
                  <p id="featured-copy" class="spotlight-copy">
                    Khi có dữ liệu, mục này sẽ tóm tắt loại vàng đáng chú ý nhất để bạn so nhanh.
                  </p>
                </article>

                <article class="spotlight-mini">
                  <p class="section-label">Quy đổi nhanh</p>
                  <h3>1 cây = 10 chỉ</h3>
                  <p>Dùng ngay ở bộ tính để ước lượng số tiền mua theo giá bán ra mới nhất.</p>
                </article>

                <article class="spotlight-mini">
                  <p class="section-label">Nguồn đọc</p>
                  <h3 id="source-preview-host">--</h3>
                  <p>Trang nguồn được giữ sẵn để bạn đối chiếu hoặc kiểm tra lại khi cần.</p>
                </article>
              </div>
            </section>
          </div>

          <aside class="content-side">
            <section class="panel calc-panel" id="cong-cu" aria-label="Công cụ tính tiền mua vàng">
              <p class="section-label">Quick Tool</p>
              <h2 class="panel-title">Ước tính chi phí mua vàng</h2>
              <p class="calc-desc">
                Chọn loại vàng, nhập số lượng theo cây hoặc chỉ để tính nhanh số tiền cần chuẩn bị.
              </p>

              <div class="form-group">
                <label for="calc-type">Loại vàng</label>
                <div class="select-wrap">
                  <select id="calc-type">
                    <option value="">Đang tải dữ liệu...</option>
                  </select>
                </div>
              </div>

              <div class="calc-row">
                <div class="form-group">
                  <label for="calc-amount">Số lượng</label>
                  <input id="calc-amount" type="text" inputmode="decimal" value="1" placeholder="Ví dụ: 2,5" />
                </div>

                <div class="form-group">
                  <label for="calc-unit">Đơn vị</label>
                  <div class="select-wrap">
                    <select id="calc-unit">
                      <option value="cay">Cây</option>
                      <option value="chi">Chỉ</option>
                    </select>
                  </div>
                </div>
              </div>

              <div class="calc-result" aria-live="polite">
                <p class="result-label">Giá bán ra đang chọn</p>
                <p id="calc-price" class="result-value">--</p>
                <p class="result-label">Tổng tiền ước tính</p>
                <p id="calc-total" class="result-total">--</p>
                <p id="calc-hint" class="result-hint">Chưa đủ dữ liệu để tính.</p>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted } from "vue";

const PAGE_TITLE = "Bảng điều khiển giá vàng | Raintee Market";
const PAGE_DESCRIPTION = "UI giá vàng mới với phong cách dashboard lấy cảm hứng từ api/docs của Raintee.";
const RUNTIME_SCRIPT_ID = "gold-market-runtime-script";
const RUNTIME_SCRIPT_SRC = "https://api.nqminkhuy.com/Gold-Market/app.js";

let runtimeScript = null;

function ensureMetaDescription(content) {
  if (typeof document === "undefined") {
    return;
  }

  let descriptionNode = document.querySelector('meta[name="description"]');
  if (!descriptionNode) {
    descriptionNode = document.createElement("meta");
    descriptionNode.setAttribute("name", "description");
    document.head.appendChild(descriptionNode);
  }

  descriptionNode.setAttribute("content", content);
}

function mountRuntimeScript() {
  if (typeof document === "undefined") {
    return;
  }

  const existingScript = document.getElementById(RUNTIME_SCRIPT_ID);
  if (existingScript?.parentNode) {
    existingScript.parentNode.removeChild(existingScript);
  }

  const script = document.createElement("script");
  script.id = RUNTIME_SCRIPT_ID;
  script.src = RUNTIME_SCRIPT_SRC;
  script.async = true;
  document.body.appendChild(script);
  runtimeScript = script;
}

onMounted(() => {
  document.title = PAGE_TITLE;
  ensureMetaDescription(PAGE_DESCRIPTION);
  mountRuntimeScript();
});

onBeforeUnmount(() => {
  if (runtimeScript?.parentNode) {
    runtimeScript.parentNode.removeChild(runtimeScript);
  }
});
</script>

<style>
@import url("https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=Space+Grotesk:wght@500;700&display=swap");
@import "./styles.css";

.gold-market-page {
  min-height: 100vh;
}
</style>
