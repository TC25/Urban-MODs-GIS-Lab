//Author: TC Chakraborty
//website: https://tc25.github.io/


//*******This script should be run on the Google Earth Engine Javascript API (https://earthengine.google.com/)*********//


//Load feature collection of New Haven's census tracts from user assets 
//
//var ROI=ee.FeatureCollection('users/tirthankarchakraborty/NewHaven_Redlining')
var ROI=ee.FeatureCollection('users/tirthankarchakraborty/NewHaven_income')


//water mask
var Water = ee.Image("JRC/GSW1_0/GlobalSurfaceWater").select("occurrence");


//var ROI=ROI.select(['HC01_VC85','GEOID10','DP0120001','DP0080004'],['Med_house_inc','GEOID10','Tot_pop','AfAm_pop'])
print(ROI)
var trees=ee.FeatureCollection('users/tirthankarchakraborty/Trees_NewHaven_URI_new')
//print(trees.limit(10))

var trees=trees.filterMetadata('Street','not_contains','Parks')
//Add layer to map to visualize data
Map.addLayer(ROI,{},"New Haven Shapefile") 

//Set map center and zoom level (Zoom level varies from lowest(1) to highest(20))
Map.setCenter(-72.9, 41.3, 12)

//Load MODIS image collection from the Earth Engine archive
var MODIS=ee.ImageCollection('MODIS/006/MOD13A1');

//print image collection to check structure of dataset
print(MODIS)
//Map.addLayer(Water.clip(ROI))

//Create summer filter
var SumFilter=ee.Filter.dayOfYear(172,266);


//Select the band of interest, in this case: NDVI
var NDVI=MODIS.select('NDVI')

//Filter the date range of interest using a date filter
var NDVI_dateofint=NDVI.filterDate('2014-01-01','2018-12-30').filter(SumFilter);

//Take pixel-wise mean of all the images in the collection
var NDVI_mean=NDVI_dateofint.mean()

//Multiply each pixel by scaling factor to get the NDVI values
var NDVI_final=NDVI_mean.multiply(.0001)

//Clip data to region of interest
var NDVI_NewHaven=NDVI_final.clip(ROI).updateMask(Water.mask().not())

//Add data to map to visualize it; add visualization properties
//Map.addLayer(NDVI_NewHaven,{min:0, max:.8, palette:['blue','yellow','green']},"NDVI pixel")

//Similarly for LST

//Load MODIS image collection from the Earth Engine archive
var MODIS_LST=ee.ImageCollection('MODIS/006/MYD11A2');

//print image collection to check structure of dataset
print(MODIS_LST)


//Select the band of interest, in this case: NDVI
var LST=MODIS_LST.select('LST_Day_1km')

//Filter the date range of interest using a date filter
var LST_dateofint=LST.filterDate('2014-01-01','2018-12-30').filter(SumFilter);

//Take pixel-wise mean of all the images in the collection
var LST_mean=LST_dateofint.mean()

//Multiply each pixel by scaling factor to get the NDVI values
var LST_final=LST_mean.multiply(.02)

//Clip data to region of interest
var LST_NewHaven=LST_final.clip(ROI).subtract(273.15).updateMask(Water.mask().not())




//cloud mask
function maskL8sr(image) {
  // Bits 3 and 5 are cloud shadow and cloud, respectively.
  var cloudShadowBitMask = (1 << 3);
  var cloudsBitMask = (1 << 5);
  // Get the pixel QA band.
  var qa = image.select('pixel_qa');
  // Both flags should be set to zero, indicating clear conditions.
  var mask = qa.bitwiseAnd(cloudShadowBitMask).eq(0)
                 .and(qa.bitwiseAnd(cloudsBitMask).eq(0));
  return image.updateMask(mask);
}

//vis params
var vizParams = {
  bands: ['B5', 'B6', 'B4'],
  min: 0,
  max: 4000,
  gamma: [1, 0.9, 1.1]
};
var vizParams2 = {
  bands: ['B4', 'B3', 'B2'],
  min: 0,
  max: 3000,
  gamma: 1.4,
};

//load the collection:
{
var col = ee.ImageCollection('LANDSAT/LC08/C01/T1_SR')
.map(maskL8sr)
.filterDate('2014-01-01','2018-12-30').filter(SumFilter)
.filterBounds(ROI);
}
//print(col, 'coleccion');

//median
{
var image = col.median().clip(ROI).updateMask(Water.mask().not());
print(image, 'image');
Map.addLayer(image, vizParams2);
}

// NDVI:
{
var ndvi = image.normalizedDifference(['B5', 'B4']).rename('NDVI').updateMask(Water.mask().not());
var ndviParams = {min: 0, max: 1, palette: ['blue', 'white', 'green']};
print(ndvi,'ndvi');
Map.addLayer(ndvi, ndviParams, 'ndvi');
}

//

//select thermal band 10(with brightness tempereature), no BT calculation 
 var thermal= image.select('B10').multiply(0.1).updateMask(Water.mask().not());
 
 /*{
var min = ee.Number(thermal.reduceRegion({
   reducer: ee.Reducer.min(),
   geometry: geometry,
   scale: 30,
   maxPixels: 1e9
   }).values().get(0));
print(min, 'min');
var max = ee.Number(thermal.reduceRegion({
    reducer: ee.Reducer.max(),
   geometry: geometry,
   scale: 30,
   maxPixels: 1e9
   }).values().get(0));
print(max, 'max')
}*/
 var b10Params = {min: 2878000, max: 3046000, palette: ['blue', 'white', 'green']};
 //Map.addLayer(thermal, b10Params, 'thermal');


// find the min and max of NDVI
{
var min = ee.Number(ndvi.reduceRegion({
   reducer: ee.Reducer.min(),
   geometry: ROI,
   scale: 30,
   maxPixels: 1e9
   }).values().get(0));
print(min, 'min');
var max = ee.Number(ndvi.reduceRegion({
    reducer: ee.Reducer.max(),
   geometry: ROI,
   scale: 30,
   maxPixels: 1e9
   }).values().get(0));
print(max, 'max')
}

//fractional vegetation
{
var fv = ndvi.subtract(min).divide(max.subtract(min)).rename('FV'); 
print(fv, 'fv');
//Map.addLayer(fv);
}

/////////////


  //Emissivity

  var a= ee.Number(0.004);
  var b= ee.Number(0.986);
  var EM=fv.multiply(a).add(b).rename('EMM').updateMask(Water.mask().not());
  
  /*{
var min = ee.Number(EM.reduceRegion({
   reducer: ee.Reducer.min(),
   geometry: geometry,
   scale: 30,
   maxPixels: 1e9
   }).values().get(0));
print(min, 'min');
var max = ee.Number(EM.reduceRegion({
    reducer: ee.Reducer.max(),
   geometry: geometry,
   scale: 30,
   maxPixels: 1e9
   }).values().get(0));
print(max, 'max')
}*/
  var imageVisParam2 = {min: 0.98, max: 0.99, palette: ['blue', 'white', 'green']};
  Map.addLayer(EM, imageVisParam2,'EMM');

var LST_Landsat = thermal.expression(
    '(Tb/(1 + (0.001145* (Tb / 1.438))*log(Ep)))-273.15', {
      'Tb': thermal.select('B10'),
      'Ep': EM.select('EMM')
}).updateMask(Water.mask().not());

//print(LST_Landsat)

//Reduce region to get mean
function Neighborhood_mean(feature){
  //Calculate spatial mean value of NDVI for each census tract
  var reduced_NDVI= NDVI_NewHaven.reduceRegion({reducer:ee.Reducer.mean(), geometry: feature.geometry(), scale:500})
  var reduced_LST= LST_NewHaven.reduceRegion({reducer:ee.Reducer.mean(), geometry: feature.geometry(), scale:500})
  var reduced_trees= ee.Number(trees.filterBounds(feature.geometry()).size())//
  var reduced_LST_Landsat=LST_Landsat.reduceRegion({reducer:ee.Reducer.mean(), geometry: feature.geometry(), scale:30})
  var reduced_ndvi_Landsat=ndvi.reduceRegion({reducer:ee.Reducer.mean(), geometry: feature.geometry(), scale:30})
    var reduced_tree_dens= ee.Number(trees.filterBounds(feature.geometry()).size()).divide(feature.geometry().area())
    var reduced_BT=thermal.reduceRegion({reducer:ee.Reducer.mean(), geometry: feature.geometry(), scale:30})
  //Add the calculated NDVI value as a property for each census tract
  
  return feature.set({'NDVI':reduced_NDVI.get('NDVI'),'LST':reduced_LST.get('LST_Day_1km'), 'LST_Landsat': reduced_LST_Landsat.get('B10'), 'BT_Landsat': reduced_BT.get('B10'), 'NDVI_Landsat':reduced_ndvi_Landsat.get('NDVI'), 'Tree_count':reduced_trees,'Tree_density':reduced_tree_dens.multiply(1000000)})
}
 
//Map the function over each census tract
var Reduced=ROI.map(Neighborhood_mean)

print(Reduced)
//Convert vector to raster for visualization
var NDVI_MODIS=Reduced.reduceToImage({properties:ee.List(['NDVI']),reducer:ee.Reducer.first()})
print(NDVI_MODIS)
//Map.addLayer(Final,{min:.2, max:.6, palette:["red","yellow","green","darkgreen"]},'NDVI census')

//var Reduced=Reduced.select({propertySelectors: ['GEOID10','LST', 'LST_Landsat','NDVI', 'NDVI_Landsat', 'Tree_count','Tree_density','BT_Landsat','Med_house_inc','Tot_pop','AfAm_pop'], retainGeometry: false})
var Reduced=Reduced.select({propertySelectors: ['GEOID10','LST', 'LST_Landsat','NDVI', 'NDVI_Landsat', 'Tree_count','Tree_density','BT_Landsat','Med_Inc','Pov_Rate','Crime_Rate'], retainGeometry: false})
//var Reduced=Reduced.select({propertySelectors: ['GEOID10','LST', 'LST_Landsat','NDVI', 'NDVI_Landsat', 'Tree_count','Tree_density','BT_Landsat','holc_grade'], retainGeometry: false})



var DEM=ee.Image('USGS/SRTMGL1_003')

DEM=DEM.clip(ROI)

//Export data as image or as table to Drive; can also be exported to asset or google cloud storage
Export.image.toDrive({image:NDVI_MODIS, description:'NewHaven_NDVI', folder: 'Urban_mods', region: ROI.geometry().bounds(), scale:500})
Export.table.toDrive({collection:Reduced, description:'NewHaven_censustracts', folder: 'Urban_mods', fileFormat: 'CSV'})

Export.image.toDrive({image:LST_NewHaven, description:'NewHaven_LST', folder: 'Urban_mods', region: ROI.geometry().bounds(), scale:500})

Export.image.toDrive({image:LST_Landsat, description:'NewHaven_LST_Landsat', folder: 'Urban_mods', region: ROI.geometry().bounds(), scale:30})
Export.image.toDrive({image:ndvi, description:'NewHaven_NDVI_Landsat', folder: 'Urban_mods', region: ROI.geometry().bounds(), scale:30})

Export.image.toDrive({image:DEM, description:'NewHaven_DEM_SRTM', folder: 'Urban_mods', region: ROI.geometry().bounds(), scale:30})


Map.addLayer(LST_Landsat,{palette: ['blue','white','red'], min: 22, max: 33},'LST_Landsat')

//var colors = ee.List(["yellow","green", "blue", "aqua", "white", "pink", "deeppink", "red"])
//var result = Reduced.map(function(f) {
//    var colorIndex = ee.Number(f.get('NDVI')).divide(.05).min(15).int()
//    return f.set('style', {color: colors.get(colorIndex), NDVI: colorIndex})
//})

//Map.addLayer(result.style({styleProperty: 'style'}))//,{min:0, max:.8})
