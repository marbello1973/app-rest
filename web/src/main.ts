import { ApiClient } from "../../pkg/app_wasm";
import init, { main } from "../../pkg/app_wasm";

interface HttpHeader {
  key: string;
  value: string;
  enabled: boolean;
}

interface HttpRequest {
  method: string;
  url: string;
  headers: HttpHeader[];
  body: string;
}

interface HttpResponse {
  status: number;
  status_text: string;
  headers: [string, string][];
  body: string;
  time: number;
}

class PostmanApp {
  private request: HttpRequest = {
    method: "GET",
    url: "https://jsonplaceholder.typicode.com/posts/1",
    headers: [
      { key: "Content-Type", value: "application/json", enabled: true },
      { key: "Accept", value: "application/json", enabled: true },
    ],
    body: "",
  };

  private response: HttpResponse | null = null;
  private loading: boolean = false;

  constructor() {
    this.initializeApp();
  }

  async initializeApp() {
    await init();
    main();
    this.render();
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Método HTTP
    document.getElementById("http-method")?.addEventListener("change", (e) => {
      this.request.method = (e.target as HTMLSelectElement).value;
    });

    // URL
    document.getElementById("request-url")?.addEventListener("input", (e) => {
      this.request.url = (e.target as HTMLInputElement).value;
    });

    // Body
    document.getElementById("request-body")?.addEventListener("input", (e) => {
      this.request.body = (e.target as HTMLTextAreaElement).value;
    });

    // Send button
    document.getElementById("send-request")?.addEventListener("click", () => {
      this.sendRequest();
    });

    // Add header button
    document.getElementById("add-header")?.addEventListener("click", () => {
      this.request.headers.push({ key: "", value: "", enabled: true });
      this.renderHeaders();
    });
  }

  async sendRequest() {
    this.loading = true;
    this.render();

    try {
      // Convertir headers al formato esperado por Rust
      const rustHeaders = this.request.headers
        .filter((h) => h.enabled && h.key.trim() && h.value.trim())
        .map((h) => [h.key.trim(), h.value.trim()]);

      const requestData = {
        method: this.request.method,
        url: this.request.url,
        headers: rustHeaders,
        body: this.request.body,
      };

      const response = await ApiClient.send_request(requestData);
      this.response = response as unknown as HttpResponse;
    } catch (error) {
      console.error("Request error:", error);
      this.response = {
        status: 0,
        status_text: "Error",
        headers: [],
        body: `Error: ${error}`,
        time: 0,
      };
    }

    this.loading = false;
    this.render();
  }

  renderHeaders() {
    const headersContainer = document.getElementById("headers-container");
    if (!headersContainer) return;

    headersContainer.innerHTML = "";

    this.request.headers.forEach((header, index) => {
      const headerRow = document.createElement("div");
      headerRow.className = "header-row";
      headerRow.innerHTML = `
                <input type="checkbox" ${header.enabled ? "checked" : ""} 
                    onchange="app.toggleHeader(${index}, this.checked)">
                <input type="text" placeholder="Key" value="${header.key}" 
                    oninput="app.updateHeaderKey(${index}, this.value)">
                <input type="text" placeholder="Value Ej: application/json" value="${header.value}" 
                    oninput="app.updateHeaderValue(${index}, this.value)">
                <button onclick="app.removeHeader(${index})">×</button>
            `;
      headersContainer.appendChild(headerRow);
    });
  }

  toggleHeader(index: number, enabled: boolean) {
    this.request.headers[index].enabled = enabled;
  }

  updateHeaderKey(index: number, key: string) {
    this.request.headers[index].key = key;
  }

  updateHeaderValue(index: number, value: string) {
    this.request.headers[index].value = value;
  }

  removeHeader(index: number) {
    this.request.headers.splice(index, 1);
    this.renderHeaders();
  }

  render() {
    this.renderRequestPanel();
    this.renderResponsePanel();
  }

  renderRequestPanel() {
    const methodSelect = document.getElementById(
      "http-method",
    ) as HTMLSelectElement;
    const urlInput = document.getElementById("request-url") as HTMLInputElement;
    const bodyTextarea = document.getElementById(
      "request-body",
    ) as HTMLTextAreaElement;
    const sendButton = document.getElementById(
      "send-request",
    ) as HTMLButtonElement;

    if (methodSelect) methodSelect.value = this.request.method;
    if (urlInput) urlInput.value = this.request.url;
    if (bodyTextarea) bodyTextarea.value = this.request.body;
    if (sendButton) sendButton.disabled = this.loading;

    this.renderHeaders();
  }

  renderResponsePanel() {
    const responseStatus = document.getElementById("response-status");
    const responseTime = document.getElementById("response-time");
    const responseHeaders = document.getElementById("response-headers");
    const responseBody = document.getElementById("response-body");

    if (this.loading) {
      if (responseStatus) responseStatus.textContent = "Loading...";
      if (responseTime) responseTime.textContent = "";
      if (responseHeaders) responseHeaders.textContent = "";
      if (responseBody) responseBody.textContent = "";
      return;
    }

    if (this.response) {
      if (responseStatus) {
        let badgeClass = "info";
        const status = NUmber(this.response.status);
        if (status >= 200 && status < 300) {
          badgeClass = "success";
        } else if (status >= 400 && status < 500) {
          badgeClass = "error";
        } else if (status >= 500) {
          badgeClass = "error";
        } else if (status >= 300 && status < 400) {
          badgeClass = "warning";
        }
        responseStatus.innerHTML = `
                <span class="status-badge ${badgeClass}">
            ${this.response.status} ${this.response.status_text}
                </span>
            `;
      }

      if (responseTime)
        responseTime.textContent = `${this.response.time.toFixed(2)}ms`;

      if (responseHeaders) {
        responseHeaders.textContent = this.response.headers
          .map(([key, value]) => `${key}: ${value}`)
          .join("\n");
      }

      if (responseBody) {
        try {
          const parsed = JSON.parse(this.response.body);
          responseBody.textContent = JSON.stringify(parsed, null, 2);
        } catch {
          responseBody.textContent = this.response.body;
        }
      }
    }
  }
}

// @ts-ignore
window.app = new PostmanApp();
