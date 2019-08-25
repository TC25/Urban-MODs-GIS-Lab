# GIS_MODS2019.R
# TC Chakraborty & Natalie Schultz
# August 2019

# This script is for examining the relationships between LST, NDVI, 
# and socioeconomic data for the census tracts of New Haven


##Install the packages we need for this script to run
install.packages("openxlsx") # To open Excel files
install.packages("ggplot2")  # For better plots & visualizations
install.packages("hash")     # To create hash table


##After installing, we need to load these packages
library(openxlsx)
library(ggplot2)
library(hash)


##Set working directory (change to where you saved the downloaded material)
#----------------------------------------------------------------------------------
setwd("N:/UMODS_2019/Final cleaned")
#----------------------------------------------------------------------------------


##Read in data
All<-read.csv('NewHaven_censustracts.csv')


##Change the variables here and the rest of the script should respond automatically
#----------------------------------------------------------------------------------
y_nam="LST_Landsat"    # y-axis
x_nam="NDVI_Landsat"   # x-axis
#----------------------------------------------------------------------------------


y_dat=All[[y_nam]]
x_dat=All[[x_nam]]


##Hash tables to dynamically control axes labels and title
h_label<-hash()
h_label[["LST_Landsat"]] <- "Land Surface Temperature from Landsat (deg C)"
h_label[["Med_Inc"]] <- "Median Household Income for Census Tract ($)"
h_label[["NDVI_Landsat"]] <- "Normalized Difference Vegetation Index from Landsat"
h_label[["Pov_Rate"]] <- "Poverty Rate for Census Tract (%)"
h_label[["Crime_Rate"]] <- "Crime Rate for Census Tract (%)"
h_label[["Tree_count"]] <- "Number of Street Trees in Census Tract"
h_label[["Tree_density"]] <- "Street Tree Density in Census Tract (/square km)"

h_title<-hash()
h_title[["LST_Landsat"]] <- "Landsat LST"
h_title[["Med_Inc"]] <- "income"
h_title[["NDVI_Landsat"]] <- "Landsat NDVI"
h_title[["Pov_Rate"]] <- "poverty rate"
h_title[["Crime_Rate"]] <- "crime rate"
h_title[["Tree_count"]] <- "street tree count"
h_title[["Tree_density"]] <- "street tree density"


##Function to add a plus before positive numbers
with_plus <- function(x, ...)
{
  if (x > 0)
  {
    sprintf(
      fmt = "+ %s", 
      format(x, ...)
    )
  }
  else
  {
    x
  }
}


##Run linear model to get best fit line and statistics
igfit <- lm(y_dat~x_dat)                # linear model function
R_sq<-summary(igfit)$r.squared          # R^2
p_val<-summary(igfit)$coefficients[,4]  # p-value 
Interc<-summary(igfit)$coefficients[,1] # intercept
x<-summary(igfit)$coefficients[2,1]     # slope
L<-length(y_dat)                        # number of data points


##Scatterplot+line of best fit
p=ggplot(All, aes(x=x_dat, y=y_dat)) +
  geom_point(shape=19, color="red", size=3)+xlab(values(h_label, keys=x_nam))+ylab(values(h_label, keys=y_nam))+
  geom_smooth(method=lm, se=FALSE, linetype="dashed",
              color="midnightblue", fill="purple")


##Create a label variable to display the equation for the line of best fit, 
##The r2 value, the p-value, and the number of samples used
mylabel = bquote(italic(y) == .(format(round(Interc,2),nsmall=2))~.(with_plus(format(round(x,2),nsmall=2)))~'x;'~italic(r)^2== .(format(round(R_sq,2),nsmall=2))~';'~p==.(format(round(p_val,3),nsmall=3))~'('~n==.(format(L))~')')


##Display the plot you created earlier and add the plot title and subtitle
p+ggtitle(label=paste("Correlation between", values(h_title, keys=y_nam), "and", values(h_title, keys=x_nam) ,"for the census tracts of New Haven"), subtitle=mylabel)#+xlim(100, 400)+ylim(100, 400)




