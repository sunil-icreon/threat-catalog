"use server";

import { VulnerabilityService } from "@/lib/vulnerabilityService";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";

export async function actionGetVulnerabilitiesData() {
  const vulnerabilityService = VulnerabilityService.getInstance();

  if (vulnerabilityService.shouldReturnFromCache) {
    console.log("Returned from Cache");
    return vulnerabilityService.getResponseObject(
      vulnerabilityService.cache,
      vulnerabilityService.statCache
    );
  }

  console.log("Returned from DB");
  return await vulnerabilityService.updateVulnerabilities();
}

export async function actionFetchLatest(config: {
  duration: string;
  ecosystem: string;
  apiKey: string;
}) {
  const { duration = "week", ecosystem = "npm", apiKey } = config;

  if (!apiKey || apiKey !== process.env.NEXT_PUBLIC_VUL_API_KEY) {
    console.log("fetchLatest returned with 403");
    return { errorMsg: "Unauthorized. API key is required", status: 403 };
  }

  const vulnerabilityService = VulnerabilityService.getInstance();
  vulnerabilityService.shouldReturnFromCache = false;
  vulnerabilityService.resultKey++;

  const result = await vulnerabilityService.getLatestVulnerabilities(
    duration,
    ecosystem,
    apiKey
  );

  revalidatePath("/");
  revalidateTag("advisories");

  return result;
}

export async function actionPurgeCache() {
  const vulnerabilityService = VulnerabilityService.getInstance();
  vulnerabilityService.resultKey++;
  vulnerabilityService.shouldReturnFromCache = false;
}

export async function clearVulnerabilityActionData() {
  revalidateTag("advisories");
}

// Cache the packages list - updates on next build
const getCachedPackages = unstable_cache(
  async () => {
    // Package list with name, version, and ecosystem
    return [
    { name: "@formio/react", version: "^5.3.0", ecosystem: "npm" },
    { name: "@sitecore-feaas/clientside", version: "0.5.21", ecosystem: "npm" },
    { name: "@sitecore-jss/sitecore-jss", version: "22.8.0", ecosystem: "npm" },
    { name: "@sitecore-jss/sitecore-jss-nextjs", version: "21.2.4", ecosystem: "npm" },
    { name: "@sitecore/engage", version: "1.4.3", ecosystem: "npm" },
    { name: "@types/luxon", version: "^3.4.2", ecosystem: "npm" },
    { name: "@azure/msal-browser", version: "3.28.1", ecosystem: "npm" },
    { name: "@progress/kendo-data-query", version: "1.6.0", ecosystem: "npm" },
    { name: "@progress/kendo-drawing", version: "1.17.6", ecosystem: "npm" },
    { name: "@progress/kendo-licensing", version: "1.3.1", ecosystem: "npm" },
    { name: "@progress/kendo-react-animation", version: "5.19.0", ecosystem: "npm" },
    { name: "@progress/kendo-react-buttons", version: "5.19.0", ecosystem: "npm" },
    { name: "@progress/kendo-react-common", version: "5.19.0", ecosystem: "npm" },
    { name: "@progress/kendo-react-data-tools", version: "5.19.0", ecosystem: "npm" },
    { name: "@progress/kendo-react-dateinputs", version: "5.19.0", ecosystem: "npm" },
    { name: "@progress/kendo-react-dialogs", version: "5.19.0", ecosystem: "npm" },
    { name: "@progress/kendo-react-dropdowns", version: "5.19.0", ecosystem: "npm" },
    { name: "@progress/kendo-react-editor", version: "6.0.2", ecosystem: "npm" },
    { name: "@progress/kendo-react-excel-export", version: "5.19.0", ecosystem: "npm" },
    { name: "@progress/kendo-react-form", version: "5.18.0", ecosystem: "npm" },
    { name: "@progress/kendo-react-grid", version: "5.18.0", ecosystem: "npm" },
    { name: "@progress/kendo-react-indicators", version: "5.19.0", ecosystem: "npm" },
    { name: "@progress/kendo-react-inputs", version: "5.19.0", ecosystem: "npm" },
    { name: "@progress/kendo-react-intl", version: "5.19.0", ecosystem: "npm" },
    { name: "@progress/kendo-react-notification", version: "5.19.0", ecosystem: "npm" },
    { name: "@progress/kendo-react-pdf", version: "6.0.2", ecosystem: "npm" },
    { name: "@progress/kendo-react-popup", version: "5.19.0", ecosystem: "npm" },
    { name: "@progress/kendo-react-progressbars", version: "5.19.0", ecosystem: "npm" },
    { name: "@progress/kendo-react-tooltip", version: "5.19.0", ecosystem: "npm" },
    { name: "@progress/kendo-react-treeview", version: "5.19.0", ecosystem: "npm" },
    { name: "@progress/kendo-svg-icons", version: "1.9.0", ecosystem: "npm" },
    { name: "@progress/kendo-theme-default", version: "6.7.0", ecosystem: "npm" },
    { name: "axios", version: "1.12.0", ecosystem: "npm" },
    { name: "bootstrap", version: "^5.3.7", ecosystem: "npm" },
    { name: "bootstrap", version: "5.3.2", ecosystem: "npm" },
    { name: "change-case", version: "^5.4.4", ecosystem: "npm" },
    { name: "constant-case", version: "^3.0.4", ecosystem: "npm" },
    { name: "cookies-next", version: "^4.3.0", ecosystem: "npm" },
    { name: "crypto-js", version: "^4.2.0", ecosystem: "npm" },
    { name: "dompurify", version: "3.2.6", ecosystem: "npm" },
    { name: "env-cmd", version: "10.1.0", ecosystem: "npm" },
    { name: "font-awesome", version: "^4.7.0", ecosystem: "npm" },
    { name: "font-awesome", version: "4.7.0", ecosystem: "npm" },
    { name: "formiojs", version: "^4.21.7", ecosystem: "npm" },
    { name: "graphql", version: "^16.9.0", ecosystem: "npm" },
    { name: "graphql-tag", version: "^2.12.6", ecosystem: "npm" },
    { name: "jquery", version: "3.7.1", ecosystem: "npm" },
    { name: "jQuery-QueryBuilder", version: "3.0.0", ecosystem: "npm" },
    { name: "luxon", version: "^3.4.4", ecosystem: "npm" },
    { name: "luxon", version: "3.4.3", ecosystem: "npm" },
    { name: "next", version: "14.2.33", ecosystem: "npm" },
    { name: "next-auth", version: "^4.24.7", ecosystem: "npm" },
    { name: "next-localization", version: "^0.12.0", ecosystem: "npm" },
    { name: "rc-pagination", version: "^4.3.0", ecosystem: "npm" },
    { name: "react", version: "^18.3.1", ecosystem: "npm" },
    { name: "react", version: "16.14.0", ecosystem: "npm" },
    { name: "react-bootstrap", version: "^2.10.3", ecosystem: "npm" },
    { name: "react-dom", version: "^18.3.1", ecosystem: "npm" },
    { name: "react-dom", version: "16.14.0", ecosystem: "npm" },
    { name: "react-dropzone", version: "^14.2.3", ecosystem: "npm" },
    { name: "react-formio", version: "^4.3.0", ecosystem: "npm" },
    { name: "react-hook-form", version: "^7.60.0", ecosystem: "npm" },
    { name: "react-imask", version: "^7.6.1", ecosystem: "npm" },
    { name: "react-imask", version: "7.5.0", ecosystem: "npm" },
    { name: "react-international-phone", version: "^4.3.0", ecosystem: "npm" },
    { name: "react-international-phone", version: "4.2.6", ecosystem: "npm" },
    { name: "react-lottie-player", version: "2.1.0", ecosystem: "npm" },
    { name: "react-lottie-player", version: "1.5.6", ecosystem: "npm" },
    { name: "react-player", version: "^2.16.0", ecosystem: "npm" },
    { name: "react-redux", version: "8.1.2", ecosystem: "npm" },
    { name: "react-router-dom", version: "6.30.1", ecosystem: "npm" },
    { name: "react-share", version: "^5.1.0", ecosystem: "npm" },
    { name: "react-slick", version: "^0.30.2", ecosystem: "npm" },
    { name: "redux", version: "4.2.1", ecosystem: "npm" },
    { name: "redux-react-i18n", version: "2.0.1", ecosystem: "npm" },
    { name: "redux-thunk", version: "2.4.2", ecosystem: "npm" },
    { name: "sass", version: "^1.89.2", ecosystem: "npm" },
    { name: "sass-alias", version: "^1.0.5", ecosystem: "npm" },
    { name: "zustand", version: "^4.5.7", ecosystem: "npm" },
    { name: "@babel/plugin-proposal-class-properties", version: "7.18.6", ecosystem: "npm" },
    { name: "@babel/plugin-proposal-decorators", version: "^7.24.7", ecosystem: "npm" },
    { name: "@babel/plugin-transform-modules-commonjs", version: "^7.24.7", ecosystem: "npm" },
    { name: "@babel/plugin-transform-react-jsx", version: "^7.24.7", ecosystem: "npm" },
    { name: "@babel/preset-flow", version: "^7.24.7", ecosystem: "npm" },
    { name: "@babel/preset-typescript", version: "^7.24.7", ecosystem: "npm" },
    { name: "@babel/traverse", version: "7.24.7", ecosystem: "npm" },
    { name: "@graphql-codegen/cli", version: "^5.0.7", ecosystem: "npm" },
    { name: "@graphql-codegen/import-types-preset", version: "^3.0.0", ecosystem: "npm" },
    { name: "@graphql-codegen/plugin-helpers", version: "^5.1.1", ecosystem: "npm" },
    { name: "@graphql-codegen/typed-document-node", version: "^5.1.2", ecosystem: "npm" },
    { name: "@graphql-codegen/typescript", version: "^4.0.7", ecosystem: "npm" },
    { name: "@graphql-codegen/typescript-operations", version: "^4.2.1", ecosystem: "npm" },
    { name: "@graphql-codegen/typescript-resolvers", version: "^4.1.0", ecosystem: "npm" },
    { name: "@graphql-typed-document-node/core", version: "^3.2.0", ecosystem: "npm" },
    { name: "@sitecore-jss/sitecore-jss-cli", version: "22.8.0", ecosystem: "npm" },
    { name: "@sitecore-jss/sitecore-jss-dev-tools", version: "22.0.0", ecosystem: "npm" },
    { name: "@testing-library/dom", version: "^10.1.0", ecosystem: "npm" },
    { name: "@testing-library/jest-dom", version: "^6.4.6", ecosystem: "npm" },
    { name: "@testing-library/react", version: "^16.0.0", ecosystem: "npm" },
    { name: "@testing-library/user-event", version: "^14.5.2", ecosystem: "npm" },
    { name: "@types/crypto-js", version: "^4.2.2", ecosystem: "npm" },
    { name: "@types/node", version: "^20.19.6", ecosystem: "npm" },
    { name: "@types/react", version: "^18.3.23", ecosystem: "npm" },
    { name: "@types/react-dom", version: "^18.3.7", ecosystem: "npm" },
    { name: "@types/react-input-mask", version: "^3.0.5", ecosystem: "npm" },
    { name: "@types/react-slick", version: "^0.23.13", ecosystem: "npm" },
    { name: "@types/testing-library__react", version: "^10.2.0", ecosystem: "npm" },
    { name: "@typescript-eslint/eslint-plugin", version: "^5.62.0", ecosystem: "npm" },
    { name: "@typescript-eslint/parser", version: "^5.62.0", ecosystem: "npm" },
    { name: "@vitejs/plugin-react", version: "^4.3.1", ecosystem: "npm" },
    { name: "@vitest/coverage-istanbul", version: "^1.6.1", ecosystem: "npm" },
    { name: "@vitest/coverage-v8", version: "^1.6.1", ecosystem: "npm" },
    { name: "chalk", version: "^4.1.2", ecosystem: "npm" },
    { name: "chokidar", version: "^3.6.0", ecosystem: "npm" },
    { name: "cross-env", version: "~7.0.3", ecosystem: "npm" },
    { name: "dotenv", version: "^16.6.1", ecosystem: "npm" },
    { name: "eslint", version: "^8.57.1", ecosystem: "npm" },
    { name: "eslint-config-next", version: "^13.5.11", ecosystem: "npm" },
    { name: "eslint-config-prettier", version: "10.1.8", ecosystem: "npm" },
    { name: "eslint-plugin-prettier", version: "5.5.3", ecosystem: "npm" },
    { name: "eslint-plugin-yaml", version: "^0.5.0", ecosystem: "npm" },
    { name: "graphql-let", version: "0.18.6", ecosystem: "npm" },
    { name: "jest", version: "^29.7.0", ecosystem: "npm" },
    { name: "jest-environment-jsdom", version: "^29.7.0", ecosystem: "npm" },
    { name: "loader-utils", version: "3.3.1", ecosystem: "npm" },
    { name: "minimist", version: "1.2.8", ecosystem: "npm" },
    { name: "next-router-mock", version: "^0.9.13", ecosystem: "npm" },
    { name: "npm-run-all", version: "~4.1.5", ecosystem: "npm" },
    { name: "prettier", version: "^3.6.2", ecosystem: "npm" },
    { name: "ts-jest", version: "^29.1.5", ecosystem: "npm" },
    { name: "ts-node", version: "^10.9.2", ecosystem: "npm" },
    { name: "tsconfig-paths", version: "^4.2.0", ecosystem: "npm" },
    { name: "typescript", version: "^5.5.2", ecosystem: "npm" },
    { name: "vitest", version: "^3.0.5", ecosystem: "npm" },
    { name: "yaml-loader", version: "^0.8.1", ecosystem: "npm" }
    ];
  },
  ["packages-list"], // Cache key
  {
    tags: ["packages"], // Cache tag for revalidation
    revalidate: false // Cache until next build (no time-based revalidation)
  }
);

export async function actionGetPackages() {
  const packages = await getCachedPackages();
  return { packages };
}