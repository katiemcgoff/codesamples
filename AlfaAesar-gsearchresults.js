/*  
 Author: Chelsea Fenton 
 Date  : 20090608 
  
 Purpose: Tools for use with the GP140W.pgm (search results) page on the alfa.com website 

CHANGE LOG:

KAB 20110308 - call punchoutDisplay() after pricing box has been displayed, to show/hide any page elements 
				that are Punchout-specific.
DK  20110713 - changed to use captcha instead of cookie for MSDS search
JRD 20120224 - change changepagesize() to submit its form - need to include filter value
*/

jQuery(document).ready(function() {   
   		
   		//setupminis();
   		checkyourprice();
   		
   		$('#container').css('height','');   		   		
   		
   		// populate title tags on action icons	
   		jQuery('.delete').attr('title',jQuery('#delete').html());
   		jQuery('.expand').attr('title',jQuery('#expand').html());
   		jQuery('.hide_lnk').attr('title',jQuery('#hide').html());
   		jQuery('.tech').attr('title',jQuery('#tech').html());
   		jQuery('.bulk').attr('title',jQuery('#bulk').html());
   		jQuery('.msds').attr('title',jQuery('#msds').html());
   		jQuery('.hideprices').attr('title',jQuery('#hideprices').html());

		// KAB 20091008 - do not assign title attribute to "prices" boxes on search results page
   		//jQuery('.prices').attr('title',jQuery('#prices').html());

		// if this is results for Structure Search, expand all details and prices
		if (searchtask == 'SUBSTRUCTURE')
		{
			expandimages();
			expandprices();
		}
   			
      });

String.prototype.trim = function() {
	return this.replace(/^\s+|\s+$/g,"");
};

function changepagesize()
{
	//var size = jQuery('#listsize').val();
	//window.location = "?listsize="+size;
	jQuery("#filterSearchResults").submit();
}

function getMSDS(item, region) {
    //DK 20110713 - added field to retrieve captcha text input. will be verified in getpdf function in gd120w
    var inpCaptcha = jQuery("input[name=inpCaptcha]").val();
    
	// KAB 20100217 - changed type from POST to GET for performance improvement
    jQuery.ajax({
	   		url: "GD120W.pgm",
	   		type: "GET",
	   		cache: false,
			dataType: "json",
	   		data: "task=getpdf&product=" + item + "&region=" + region + "&inpCaptcha=" + inpCaptcha,
	   		success: function (rtnmsg) {
	   			var newWindow;

				if (rtnmsg.count === 0) {
                    // JEL 20091111 - take off the leading zero
                    if (item.charAt(0) === "0") {
                        item = item.slice(1);
                    } 
                    
                    newWindow = window.open("go160w.pgm?task=noresults&MSDS=Y&term=" + item, '_top');
				} else if (rtnmsg.count > 1) {
                    newWindow = window.open("gd120w.pgm?product=" + item + "&inpCaptcha=" + inpCaptcha, '_top');
                } else if (rtnmsg.path) {
					newWindow = window.open(rtnmsg.path, '_blank');
				} else if (rtnmsg.captcha) {
					//DK 20110713 - added this if statement in case the captcha couldn't be verified. this opens a popup
					//with the captcha and an input button, which will call this function again.
					var obj = jQuery("#captcha-pop").html();

					var htm = "<div id=\"captcha-pop\"><div><div>" + rtnmsg.captcha + "</div></div><input type=\"image\" onclick=\"getMSDS('" + item + "', '" + region + "');\" src=\"images/Search.gif\" /></div>";
					loadPopup(htm);
					if(obj !== "" && obj != null)
					{
						jQuery("#captcha-invalid").removeClass("hideit");
					}
				}
	   		},
            error: function (XMLHttpRequest, textStatus, errorThrown) {
               // alert("error thrown: " + XMLHttpRequest.responseText + " " + textStatus + " " + errorThrown);
            }
	   	});	
}

// Function name: addbulk
// Purpose: adds a favorite item to a bulk quote request
// Parms:
//		item 
/* KAB 20091016 - commenting out, because this function is duplicated in products.js, and both 
	scripts are included in GP140W. If this should be added back, please tell me so I can handle 
	the conflict. */
/*
function addbulk(item){
  	
  	jQuery.ajax({
   		url: "gb100w.pgm",
   		type: "POST",
   		cache: false,
   		data: "task=addtobulk&dsstk=" + item,
   		success: function(msg){	   		  			
	   		getminibulk();
	   		getbulkitems();
   		}
   	});
}
*/

function expandall()
{
	var rrn;
	var item;
	jQuery('.rrn').each(function () {
		rrn = jQuery(this).val();								
		item = jQuery(this).parents('tr').find('.item').val();		
		
		expanditem(rrn, item);
	});
	
	jQuery('#expandall').css("display","none");	
	jQuery('#collapseall').css("display","");

	adjustHeight();
}

function collapseall()
{
	jQuery('.rrn').each(function () {
		var rrn = jQuery(this).val();
		collapseitem(rrn);
	});
	
	jQuery('#expandall').css("display","");	
	jQuery('#collapseall').css("display","none");

	adjustHeight();
}

function expanditem(rrn, item)
{	
	// KAB xxx - temporary taskname = expanditemNEW
	// KAB 20100217 - changed type from POST to GET for performance improvement
	jQuery.ajax({
   		url: "gp140w.pgm",
   		type: "GET",
   		cache: false,
   		data: "task=expanditemn&width1=120px&item=" + item,
   		success: function (msg){
			
			var id = '#expanded'+rrn;	  

			// KAB 20090814 - changed from simple message to JSON object, with "image" and 
			//	"expanded" values
			var jsonobj = eval("(" + msg + ")");

			// replace character markers with original characters, or spaces where original
			//	is unnecessary
			var details = jsonobj.expanded;
			details = details.replace(/\[\*\]/g, "'");
			details = details.replace(/\[\*\*\]/g, '"');
			details = details.replace(/\[nn\]|\[rr\]|\[tt\]/g, " ");

			// remove containing single-quotes
			details = details.substring(2, details.length - 1);

			// KAB 20090714 - replaced simple message with JSON object element
   			//jQuery(id).html(msg);
   			jQuery(id).html(details);
   			
   			tran_SwitchLang(curLang , id);
   			
   			//jQuery(id).css("display","");   			   			
   			//jQuery(id).slideDown("slow",function(){ myadjustheight();});
   			jQuery(id).fadeIn("fast",function(){ myadjustheight();});

			// KAB 20090814 - populate image
			if (jsonobj.image != "")
			{
				// replace character marker for double quotes with real symbol
	//			jsonobj.image = jsonobj.image.replace(/\[\*\*\]/g, '"');

				id = '#structimg'+rrn;	  
				jQuery(id).html(jsonobj.image);
	  			jQuery(id).fadeIn("fast",function(){ myadjustheight();});
			}


   			// hide the expand button
   			id = '#expand'+rrn;	  			
   			jQuery(id).css("display","none");
   			
   			
   			// show the hide button
   			id = '#collapse'+rrn;	  			   			
   			jQuery(id).css("display","");   			
   			
   			$('#container').css('height','');
   			
   			adjustHeight();
   		}
   	});	
}

function myadjustheight()
{
	$('#container').css('height','');
	
	adjustHeight();	
}

function collapseitem(rrn)
{	
	var expandedid = '#expanded'+rrn;

	//jQuery(id).html("");
	//jQuery(id).css("display","none");   						
	//jQuery(expandedid).slideUp("slow",function(){jQuery(expandedid).html(""); myadjustheight();});   				  				
	jQuery(expandedid).fadeOut("fast",function(){jQuery(expandedid).html(""); myadjustheight();});   				  				
	

	// KAB 20090814 - hide the image also
	var structimgid = '#structimg'+rrn;	  			
	jQuery(structimgid).fadeOut("fast",function(){jQuery(structimgid).html(""); myadjustheight();});   				  				

	// show the expand button
	expandid = '#expand'+rrn;	  			
	jQuery(expandid).css("display","");
	
	
	// hide the hide button
	var collapseid = '#collapse'+rrn;	  			
	jQuery(collapseid).css("display","none");
	
	
	$('#container').css('height','');
	
	adjustHeight();
}

function getPrices(rrn, item) {
	// it is important to declare a new variable 'id' at the start of this function because of the AJAX call
	var id = '#prices'+rrn;

	// KAB 20091016 - if rrn starts with X, it's a xref item so don't continue
	if (item != undefined && item.substr(0, 1) == "X")
	{
		// do nothing
	}
	else
	{
	
		// check if the div#id has anything in it before doing ajax, the regexp below matches on values containing only white-space characters
		if (jQuery(id).html().match(/^(\s*)$/) !== null) {	// not null means it only has white-space characters
		
			var DSSTK = jQuery('#DSSTK'+rrn).val();
			var uID = jQuery('#uID').val();
			var uLang = jQuery('#uLang').val();
			var uCurr = jQuery('#uCurr').val();
			var uShipTo = jQuery('#uShipTo').val();
			var uShipFrom = jQuery('#uShipFrom').val();
			var noshipto = jQuery('#noshipto').val();
		
			jQuery.ajax({
				type: "GET",
				url: "GP140W.pgm",
				data: "task=getPrices&DSSTK=" + DSSTK + "&uID=" + uID + "&uLang=" + uLang + "&uCurr=" +
					uCurr + "&uShipTo=" + uShipTo + "&uShipFrom=" + uShipFrom + "&noshipto=" + noshipto,
				cache: false,
				success: function (rtnHTML) {
					jQuery(id).html(rtnHTML);

					// KAB 20091004 - call span translation on pricing box
					tran_SwitchLang(curLang , id);

					// KAB 20091008 - add button alt text
					setAltTitleAttr(id);
				
					// KAB 20091016 - check if user is logged in and should see "Your Price"
					checkyourprice(id);

					//jQuery(id).css("display","");   			   			
					// JEL 20090729 fadeIn() does not work correctly with IE, use show() instead
					$.browser.msie ? jQuery(id).show() : jQuery(id).fadeIn("fast");	
							
					// hide the expand button
					id = '#getprice'+rrn;	  			
					jQuery(id).css("display","none");
							
							
					// show the hide button
					id = '#hideprice'+rrn;	  			   			
					jQuery(id).css("display","");   			
						
					$('#container').css('height', '');		

					// KAB 20110308 - modify the page elements displayed if this is a Punchout session
					punchoutDisplay();

				}
			});
		} else {
			$.browser.msie ? jQuery(id).show() : jQuery(id).fadeIn("fast");	
					
			// hide the expand button
			id = '#getprice'+rrn;	  			
			jQuery(id).css("display","none");
					
					
			// show the hide button
			id = '#hideprice'+rrn;	  			   			
			jQuery(id).css("display","");   			
				
			$('#container').css('height', '');
		}
		
		
		adjustHeight();

	}
}

function hidePrices(rrn)
{
	var id = '#prices' + rrn;	  				
	//jQuery(id).css("display","none");   				
   	// JEL 20090729 fadeOut() does not work correctly with IE, use hide() instead
   	$.browser.msie ? jQuery(id).hide() : jQuery(id).fadeOut("fast");	
	
	// show the expand button
	id = '#getprice'+rrn;	  			
	jQuery(id).css("display","");
	
	
	// hide the hide button
	id = '#hideprice' + rrn;	  			
	jQuery(id).css("display", "none");
		
	$('#container').css('height','');
	
	adjustHeight();
}

// expand all prices
function expandprices()
{
	var rrn;
	var item;
	jQuery('.rrn').each(function(){
		rrn = jQuery(this).val();								
		item = jQuery(this).parents('tr').find('.item').val();		
		
		getPrices(rrn,item);
	});
	
	jQuery('#expandprices').css("display","none");	
	jQuery('#collapseprices').css("display","");
	
	adjustHeight();
}

// collapse all prices
function collapseprices()
{
	jQuery('.rrn').each(function(){
		var rrn = jQuery(this).val();				
		
		hidePrices(rrn);
	});
	
	jQuery('#expandprices').css("display","");	
	jQuery('#collapseprices').css("display","none");

	adjustHeight();
}

// loop through all items and show images
function expandimages()
{
	var rrn;
	var item;
	jQuery('.rrn').each(function(){
		rrn = jQuery(this).val();								
		item = jQuery(this).parents('tr').find('.item').val();		
		
		showstructimg(rrn, item);
	});
}

// show just the structure image, regardless of whether the full details has been expanded
function showstructimg(rrn, item)
{
	// KAB xxx - temporary taskname = expanditemNEW
	// KAB 20100217 - changed type from POST to GET for performance improvement
	jQuery.ajax({
   		url: "gp140w.pgm",
   		type: "GET",
   		cache: false,
   		data: "task=getimage&item=" + item,
   		success: function (msg){

   			var id = '#expanded'+rrn;	  

			if (msg != "")
			{
				id = '#structimg'+rrn;	  
				jQuery(id).html(msg);
			}
   			
   			$('#container').css('height','');
   			
   			adjustHeight();
   		}
   	});	

}