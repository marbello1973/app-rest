import init, { add } from "./pkg/app_wasm.js";

init().then(() => {
  add(0n, 0n);
  const result = add(1n, 2n);
  console.log(`WASM add(1n, 2n) = ${result}`);
  console.log("log");

  const doc = document.getElementById("output");
  doc.innerText = `WASM add(1n, 2n) = ${result}`;

  const input1 = document.getElementById("input1");
  const input2 = document.getElementById("input2");
  const addButton = document.getElementById("addButton");

  addButton.addEventListener("click", () => {
    const value1 = BigInt(input1.value);
    const value2 = BigInt(input2.value);
    const result = add(value1, value2);
    doc.innerText = `WASM add(${value1}, ${value2}) = ${result}`;
  });
});
