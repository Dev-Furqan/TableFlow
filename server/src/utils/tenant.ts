/** Shared collections are tenant-isolated at every API query. */
export const restaurantFilter=(req:any,filter:any={})=>({restaurant:req.user.restaurant,...filter});
export const restaurantData=(req:any,data:any)=>({...data,restaurant:req.user.restaurant});
