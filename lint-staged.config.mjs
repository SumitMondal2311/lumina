export default {
    "**/package.json --ignore **/node_modules/**/package.json":
        "sort-package-json",
    ".": "biome format --write",
};
