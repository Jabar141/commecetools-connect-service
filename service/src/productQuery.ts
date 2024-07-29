import { Product, ProductData } from "@commercetools/platform-sdk";
import { apiRoot, projectKey } from "./apiClient";


export async function fetchCurrentAndStagedProductDetails(productID: string): Promise<{ current: ProductData; staged?: ProductData; changesStaged: boolean; }> {
    const product: Product = await getProductsByID(productID);
    const { current, staged, hasStagedChanges } = product.masterData;
    return {
        current, staged, changesStaged: hasStagedChanges ?? false
    };
}


async function getProductsByID(productID: string): Promise<Product> {
    return (await apiRoot.withProjectKey({ projectKey }).products().withId({ ID: productID }).get().execute()).body;
}
