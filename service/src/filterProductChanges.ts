import _ from "lodash";
import { Attribute, ProductData, ProductVariant } from "@commercetools/platform-sdk";
import { fetchCurrentAndStagedProductDetails } from "./productQuery";

const VARIANTS_ADDED_CONSTANT = "NEW";
const VARIANTS_DELETED_CONSTANT = "DELETED";

export async function reviewProductChanges(productID: string) {
    const locales = ["de-DE", "en-US", "en-CA", "fr-CA"];
    const { current, staged, changesStaged } = await fetchCurrentAndStagedProductDetails(productID);
    if (changesStaged && staged) {
        const changeListMap = new Map();

        //Check for name changes in locales
        changeListMap.set("Product Name", await formatNameChanges(current, staged, locales));

        //Check for description changes in locales
        changeListMap.set("Description Changes", await formatDescChanges(current, staged, locales));

        //Check for Master Variant Changes
        changeListMap.set("Master Variant", await formatMasterVariantChanges(current, staged, locales));

        //Check for Variant Changes
        // if(variantUpdates["Changes"]){
        //     changeListMap.set("Variants", (await formatVariantChanges(current, staged, locales)));
        // }
        changeListMap.set("Variants", (await formatVariantChanges(current, staged, locales)));

        const changeObject = Object.fromEntries(changeListMap);
        return changeObject;
    } else {
        return {
            message: "No Staged Changes are present in the product"
        };
    }
}

async function formatNameChanges(current: ProductData, staged: ProductData, locales: string[]) {
    const { name: currentName } = current;
    const { name: stagedName } = staged;
    let nameChangeList: any[] = [];
    locales.map(async (locale: string) => {
        if (currentName[locale] !== stagedName[locale]) {
            nameChangeList.push({
                property: `name[${locale}]`,
                current: currentName[locale].toString(),
                staged: stagedName[locale].toString()
            });
        }
    });
    if (nameChangeList.length > 0)
        return nameChangeList;
}

async function formatDescChanges(current: ProductData, staged: ProductData, locales: string[]) {
    const { description: currentDesc } = current;
    const { description: stagedDesc } = staged;
    let nameChangeList: any[] = [];
    locales.map(async (locale: string) => {
        if (currentDesc?.[locale] !== stagedDesc?.[locale]) {
            nameChangeList.push({
                property: `name[${locale}]`,
                current: currentDesc?.[locale],
                staged: stagedDesc?.[locale]
            });
        }
    });
    if (nameChangeList.length > 0)
        return nameChangeList;
}

async function formatMasterVariantChanges(current: ProductData, staged: ProductData, locales: string[]) {
    const masterVariantChangeMap = new Map();

    const { masterVariant: currentMasterVariant } = current;
    const { masterVariant: stagedMasterVariant } = staged;

    //Check for SKU Changes
    if (currentMasterVariant.sku !== stagedMasterVariant.sku) {
        masterVariantChangeMap.set("SKU", {
            property: "SKU",
            current: currentMasterVariant.sku,
            staged: stagedMasterVariant.sku
        });
    }

    //Check for Variant Key Changes
    if (currentMasterVariant.key !== stagedMasterVariant.key) {
        masterVariantChangeMap.set("Variant KEY", {
            property: "Variant KEY",
            current: currentMasterVariant.key,
            staged: stagedMasterVariant.key
        });
    }

    //Check for Variant Attribute changes
    let attributeChangeList: any[] = [];
    const currentMasterVariantAttributes = currentMasterVariant?.attributes ?? [];
    const stagedMasterVariantAttributes = stagedMasterVariant?.attributes ?? [];
    const currMasterVarAttributeName: Set<string> = new Set(await Promise.all(currentMasterVariantAttributes.map(async (attr: Attribute) => { return attr.name; })));
    const stgMasterVarAttributeName: Set<string> = new Set(await Promise.all(stagedMasterVariantAttributes.map(async (attr: Attribute) => { return attr.name; })));
    const finalAttributeNameList = Array.from(new Set([...currMasterVarAttributeName, ...stgMasterVarAttributeName]));

    for (let i = 0; i < finalAttributeNameList.length; i++) {
        const finalAttributeName = finalAttributeNameList.at(i) ?? "";
        if (currMasterVarAttributeName.has(finalAttributeName) && stgMasterVarAttributeName.has(finalAttributeName)) {
            if (_.isEqual(currentMasterVariantAttributes.at(i)?.name, stagedMasterVariantAttributes.at(i)?.name) &&
                !_.isEqual(currentMasterVariantAttributes.at(i)?.value, stagedMasterVariantAttributes.at(i)?.value)) {
                attributeChangeList.push({
                    property: currentMasterVariantAttributes.at(i)?.name,
                    currrent: currentMasterVariantAttributes.at(i)?.value,
                    staged: stagedMasterVariantAttributes.at(i)?.value
                });
            }
        } else if (!currMasterVarAttributeName.has(finalAttributeName) && stgMasterVarAttributeName.has(finalAttributeName)) {
            attributeChangeList.push({
                property: stagedMasterVariantAttributes.at(i)?.name,
                currrent: "Empty",
                staged: stagedMasterVariantAttributes.at(i)?.value
            });
        } else if (currMasterVarAttributeName.has(finalAttributeName) && !stgMasterVarAttributeName.has(finalAttributeName)) {
            attributeChangeList.push({
                property: currentMasterVariantAttributes.at(i)?.name,
                currrent: currentMasterVariantAttributes.at(i)?.value,
                staged: "Empty"
            });
        }
    }

    if (attributeChangeList.length > 0)
        masterVariantChangeMap.set("Attributes", attributeChangeList);
    if (!_.isEmpty(masterVariantChangeMap))
        return Object.fromEntries(masterVariantChangeMap);

}

async function formatVariantChanges(current: ProductData, staged: ProductData, locales: string[]) {
    const variantChangeMap = new Map();
    const { variants: currentVariants } = current;
    const { variants: stagedVariants } = staged;

    //Check for addition or deletion of variants in the product
    if (currentVariants.length !== stagedVariants.length) {
        const addOrDeleteMap = await fetchAddedOrDeletedVariant(currentVariants, stagedVariants);
        if (addOrDeleteMap)
            variantChangeMap.set("Variants_Created_OR_Deleted", Object.fromEntries(addOrDeleteMap));
        // if (addOrDeleteMap.has(VARIANTS_ADDED_CONSTANT))
        //     variantChangeMap.set("Changes", Object.fromEntries(addOrDeleteMap));
        // else
        //     variantChangeMap.set(VARIANTS_DELETED_CONSTANT, Object.fromEntries(addOrDeleteMap));
    }
    else {
        //Variant Added and Deleted at the same time
        const addedVariants = _.differenceBy(stagedVariants, currentVariants, 'id');
        const deletedVariants = _.differenceBy(currentVariants, stagedVariants, 'id');
        //if (addedVariants.length > 0 && deletedVariants.length > 0) {
        variantChangeMap.set("ADD_DELETE_SAME_TIME", { addedVariants, deletedVariants });
    }
    //else {
    const variantChangeList: any[] = [];
    //Loop on variants
    for (let i = 0; i < Math.max(currentVariants.length, stagedVariants.length); i++) {
        const individualVariantChanges = new Map();
        const cV = currentVariants.at(i);
        const sV = stagedVariants.find(async (stagedVariant: ProductVariant) => stagedVariant.id === cV?.id);
        if (sV?.id === cV?.id) {
            //Check for SKU Changes
            if (cV?.sku !== sV?.sku && cV?.id) {
                individualVariantChanges.set("SKU", {
                    property: "SKU",
                    current: cV?.sku,
                    staged: sV?.sku,
                });
            }
            //Check for Variant Key Changes
            if (cV?.key !== sV?.key) {
                individualVariantChanges.set("Variant KEY", {
                    property: "Variant KEY",
                    current: cV?.key,
                    staged: sV?.key
                });
            }
            //Check for Attribute Value Changes
            const attributeChangeList = await fetchVariantValueChanges(cV, sV);
            if (attributeChangeList.length > 0)
                individualVariantChanges.set("Attributes", attributeChangeList);
            if (!_.isEmpty(individualVariantChanges)) {
                individualVariantChanges.set("VariantID", cV?.id);
                variantChangeList.push(Object.fromEntries(individualVariantChanges));
            }
        }
    }
    if (variantChangeList.length > 0) {
        variantChangeMap.set("Changes", variantChangeList);
    }
    //}
    //}
    if (!_.isEmpty(variantChangeMap))
        return Object.fromEntries(variantChangeMap);
}

async function fetchAddedOrDeletedVariant(currentVariants: ProductVariant[], stagedVariants: ProductVariant[]) {
    if (currentVariants.length !== stagedVariants.length) {
        let operation = "";
        const variantAdditionDeletionMap: Map<string, ProductVariant[]> = new Map();
        if (currentVariants.length > stagedVariants.length)
            operation = "-";
        else
            operation = "+";

        switch (operation) {
            case "+": {
                const addedVariants: ProductVariant[] = _.differenceBy(stagedVariants, currentVariants, 'id');
                variantAdditionDeletionMap.set(VARIANTS_ADDED_CONSTANT, addedVariants);
                break;
            }
            case "-": {
                const deletedVariants: ProductVariant[] = _.differenceBy(currentVariants, stagedVariants, 'id');
                variantAdditionDeletionMap.set(VARIANTS_DELETED_CONSTANT, deletedVariants);
                break;
            }
            default: {
                console.log("Unexpected Conditions");
            }
        }
        return variantAdditionDeletionMap;
    }
}

async function fetchVariantValueChanges(currentVariant: ProductVariant | undefined, stagedVariant: ProductVariant | undefined) {
    //Check for Attribute Value Changes
    const attributeChangeList: any[] = [];
    const cvAttributes = currentVariant?.attributes ?? [];
    const svAttributes = stagedVariant?.attributes ?? [];
    const currenVariantAttributeSet = new Set(await Promise.all(cvAttributes?.map(async (attr: Attribute) => { return attr.name; })));
    const stagedVariantAttributeSet = new Set(await Promise.all(svAttributes.map(async (attr: Attribute) => { return attr.name; })));
    const finalAttributeNameList = Array.from(new Set([...currenVariantAttributeSet, ...stagedVariantAttributeSet]));

    //Loop on variant attributes
    for (let j = 0; j < finalAttributeNameList.length; j++) {
        const finalAttributeName = finalAttributeNameList.at(j) ?? "";
        if (currenVariantAttributeSet.has(finalAttributeName) && stagedVariantAttributeSet.has(finalAttributeName)) {
            if (_.isEqual(cvAttributes.at(j)?.name, svAttributes.at(j)?.name) &&
                !_.isEqual(cvAttributes.at(j)?.value, svAttributes.at(j)?.value)) {
                attributeChangeList.push({
                    property: cvAttributes.at(j)?.name,
                    currrent: cvAttributes.at(j)?.value,
                    staged: svAttributes.at(j)?.value
                });
            }
        } else if (!currenVariantAttributeSet.has(finalAttributeName) && stagedVariantAttributeSet.has(finalAttributeName)) {
            attributeChangeList.push({
                property: svAttributes.at(j)?.name,
                currrent: "Empty",
                staged: svAttributes.at(j)?.value
            });
        } else if (currenVariantAttributeSet.has(finalAttributeName) && !stagedVariantAttributeSet.has(finalAttributeName)) {
            attributeChangeList.push({
                property: cvAttributes.at(j)?.name,
                currrent: cvAttributes.at(j)?.value,
                staged: "Empty"
            });
        }
    }

    return attributeChangeList;
}
