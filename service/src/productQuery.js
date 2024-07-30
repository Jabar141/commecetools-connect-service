const { apiRoot, projectKey } =require("./apiClient");


module.exports.fetchCurrentAndStagedProductDetails = async(productID) =>{
    try{
    const product = await this.getProductsByID(productID);
    if(product.masterData!=null){
    const { current, staged, hasStagedChanges } = product.masterData;
    return {
        current, staged, changesStaged: hasStagedChanges ?? false
    };
}
else{
    return "product not found";
}
    }catch(exception){
      console.log("Error in Get Product Call");
      return "product Not found"
    }
};


module.exports.getProductsByID = async(productID) => {
    return (await apiRoot.withProjectKey({ projectKey }).products().withId({ ID: productID }).get().execute()).body;
}
