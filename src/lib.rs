use serde::{Deserialize, Serialize};
use url::Url;
use wasm_bindgen::prelude::*;
use web_sys::{Headers, Request, RequestInit};

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);

    #[wasm_bindgen(js_namespace = console, js_name = log)]
    fn log_js(value: &JsValue);
}

#[derive(Serialize, Deserialize, Debug)]
pub struct HttpRequest {
    pub method: String,
    pub url: String,
    pub headers: Vec<(String, String)>,
    pub body: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct HttpResponse {
    pub status: u16,
    pub status_text: String,
    pub headers: Vec<(String, String)>,
    pub body: String,
    pub time: f64,
}

#[wasm_bindgen]
pub struct ApiClient;

#[wasm_bindgen]
impl ApiClient {
    pub async fn send_request(request: JsValue) -> Result<JsValue, JsValue> {
        // Log the incoming request for debugging
        log("Processing request...");

        let url = Url::parse(
            &serde_wasm_bindgen::from_value::<HttpRequest>(request.clone())
                .map_err(|e| JsValue::from_str(&format!("Invalid request format: {:?}", e)))?
                .url,
        )
        .map_err(|e| JsValue::from_str(&format!("Invalid URL: {:?}", e)))?;
        if url.scheme() != "http" && url.scheme() != "https" {
            return Err(JsValue::from_str("URL must start with http:// or https://"));
        }

        let req: HttpRequest = serde_wasm_bindgen::from_value(request)
            .map_err(|e| JsValue::from_str(&format!("Invalid request format: {:?}", e)))?;

        log(&format!("Request method: {}, URL: {}", req.method, req.url));

        let opts = RequestInit::new();
        opts.set_method(&req.method);

        // Configurar headers
        let headers = Headers::new()
            .map_err(|e| JsValue::from_str(&format!("Error creating headers: {:?}", e)))?;

        for (key, value) in &req.headers {
            if !key.is_empty() && !value.is_empty() {
                if let Err(e) = headers.append(key, value) {
                    log(&format!("Warning: Failed to add header {}: {:?}", key, e));
                }
            }
        }

        // Configurar body para métodos que lo requieren
        let valid_methods = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"];
        if !valid_methods.contains(&req.method.as_str()) {
            return Err(JsValue::from_str(&format!(
                "Invalid HTTP method: {}",
                req.method,
            )));
        }
        if !req.body.is_empty() {
            if let Ok(Some(content_type)) = headers.get("Content-Type") {
                if content_type.contains("application/json") {
                    if let Err(e) = serde_json::from_str::<serde_json::Value>(&req.body) {
                        return Err(JsValue::from_str(&format!("Invalid JSON body: {:?}", e)));
                    }
                }
            } else if req.method == "POST" || req.method == "PUT" || req.method == "PATCH" {
                return Err(JsValue::from_str(
                    "Content-Type header is required when body is provided",
                ));
            }
        }
        /*
        if !req.body.is_empty()
            && (req.method == "POST" || req.method == "PUT" || req.method == "PATCH")
        {
            opts.body(Some(&JsValue::from_str(&req.body)));
        }
        */
        opts.set_headers(&headers);

        let request_obj = Request::new_with_str_and_init(&req.url, &opts)
            .map_err(|e| JsValue::from_str(&format!("Error creating request object: {:?}", e)))?;

        let window =
            web_sys::window().ok_or_else(|| JsValue::from_str("No window object available"))?;

        let start_time = js_sys::Date::now();

        // Ejecutar la petición
        let response_result =
            wasm_bindgen_futures::JsFuture::from(window.fetch_with_request(&request_obj)).await;

        let end_time = js_sys::Date::now();

        match response_result {
            Ok(response_val) => {
                let response: web_sys::Response = response_val.dyn_into().map_err(|e| {
                    JsValue::from_str(&format!("Error converting response: {:?}", e))
                })?;

                let status = response.status();

                // Manejar status_text de forma segura
                let status_text = match response.status_text() {
                    text if !text.is_empty() => text,
                    _ => "No Status Text".to_string(),
                };

                // Obtener el cuerpo de la respuesta
                let text_future = wasm_bindgen_futures::JsFuture::from(response.text()?)
                    .await
                    .map_err(|e| {
                        JsValue::from_str(&format!("Error reading response text: {:?}", e))
                    })?;

                let body = text_future
                    .as_string()
                    .unwrap_or_else(|| "No response body".to_string());

                let http_response = HttpResponse {
                    status,
                    status_text,
                    headers: Vec::new(), // Simplificado por ahora
                    body,
                    time: end_time - start_time,
                };

                log(&format!("Request completed in {:.2}ms", http_response.time));

                serde_wasm_bindgen::to_value(&http_response)
                    .map_err(|e| JsValue::from_str(&format!("Error serializing response: {:?}", e)))
            }
            Err(e) => {
                log("Request failed");
                Err(JsValue::from_str(&format!("Network error: {:?}", e)))
            }
        }
    }
}

#[wasm_bindgen(start)]
pub fn main() -> Result<(), JsValue> {
    console_error_panic_hook::set_once();
    log("Rust WASM Rest app initialized successfully!");
    Ok(())
}
