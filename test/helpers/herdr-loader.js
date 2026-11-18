const STUB = new URL("./herdr-stub.js", import.meta.url).href;

export function resolve(specifier, context, next) {
  if (specifier === "herdr") return { url: STUB, shortCircuit: true };
  return next(specifier, context);
}
