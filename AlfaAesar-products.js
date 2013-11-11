/**
 * JavaScript for Product Specific functions.
 *
 * CHANGELOG:
 * DK  20110712 - changed to handle captcha image instead of cookie
 * KAB 20120711 - Fixed bug in checkyourprice(), to hide "Your Price" column when user does not have custom pricing.
   KAB 20130116	- Fixed bug with button disabling, due to new jQuery version.
				- Removed call to update minicart, since it's not used in new design.
    SJ  20130206 - wrap sizeid with encodeURLComponent() function in addcart() function before passing sizeid to 
                  ajax call, so that whenever sizeid has special characters specially '=' sign it can be retrieved 		  by the PML function. 
                  

 */
/* <![CDATA[ */
var qoe = "";
var carturl = "go180w.pgm";
var qoecount = 0;
var ajaxtimer;

function products()
{
	//jQuery("img.imgchkavail").attr("alt", jQuery("span.imgchkavail").html()).attr("title", jQuery("span.imgchkavail").html());
	//jQuery("img.imgfavs").attr("alt", jQuery("span.imgfavs").html()).attr("title", jQuery("span.imgfavs").html());
	
	
	//jQuery("#restriction").show(1);
	if (jQuery.trim(jQuery("#restriction div").html()) != "")
	{
		jQuery("#restriction").show(1);
	}
	else
	{
		jQuery("#restriction").hide(1);
	}
	
	
	checkyourprice();
	
	var dsstk = jQuery("#product").val();
	
	
	jQuery.ajax({
		type: "GET",
		url: "GD120W.pgm",
		data: "task=pdfavail&product=" + dsstk,
		cache: false,
		success: function(dropdown)
		{
			jQuery("#MSDSdropdown").html(dropdown);
			tran_SwitchLang(ulang, "#MSDSdropdown");
			translateDropdowns();
		}
	});
	
	jQuery("#captcha-reload").live('click', function (){
		var container = jQuery(this).parent().parent();
				
		jQuery.ajax({
			url: "gd120w.pgm",
			data: "task=refreshCpt",
			success: function(rtn){
				jQuery(container).html("");
				jQuery(container).html(rtn);
				
				tran_SwitchLang(curLang , "#captcha-image");
			}
		});
	});
		
	// CDF 20090611 changed from button to input becuase of new button images
    jQuery('input[name="Search"]').click( function (event) {
        event.preventDefault;
        
        var msds_region = jQuery("#MSDSregion").val();
        var dsstk = jQuery("#product").val();
        
        //DK 20110712 - get captcha input to be verified
        var inpCaptcha = jQuery("input[name=inpCaptcha]").val();
        jQuery("#captcha-invalid").addClass("hideit");
        
        //jQuery("#msds_srch_btn").html("Please Wait...");
        
        jQuery(this).after('<span lang="Y" key="Please_wait" name="temp">Please Wait...</span>');
        tran_SwitchLang(curLang , "span[name=temp]");
        jQuery(this).attr("disabled", "disabled").css("display", "none");
   
		// KAB 20100217 - changed type from POST to GET for performance improvement
		jQuery.ajax({
            type: "GET",
            url: "GD120W.pgm",
            data: "task=getpdf&region=" + msds_region + "&product=" + dsstk + "&inpCaptcha=" + inpCaptcha,
            cache: false,
            dataType: "json",
            success: function (rtnmsg) {
                if (rtnmsg.count > 1) {
                	jQuery("#task").val("default");
                    jQuery("#msds_form").attr({target: "_top", action: "gd120w.pgm"});
                    jQuery("#msds_form").submit();
                    
                } else if (rtnmsg.path) {
                    if (jQuery.browser.msie === true && jQuery.browser.version.substr(0, 1) <= 6) {
                        jQuery("#task").remove();
                        jQuery("#msds_form").append("<input type=\"hidden\" id=\"task\" name=\"task\" value=\"servepdf\" />");
                    } else {
                        jQuery("#task").val("servepdf");
                    }
                    
                    jQuery("#msds_form").attr({target: "_blank", action: "gd120w.pdf"});
                    jQuery("#MSDSregion").attr("name", "region");
                    jQuery('#msds_form').submit();
                    jQuery("#captcha-image").html("");
                } else if(rtnmsg.captcha) {
                	//DK 20110712 - added if statement for captcha display, when function returns the verification was invalid
                	var cptHtml = jQuery("#captcha-image").html();
                	jQuery("#captcha-image").html(rtnmsg.captcha);
                	if(cptHtml != "")
                	{
                    	jQuery("#captcha-invalid").removeClass("hideit");
                    }
                    else
                    {
                    	jQuery("#captcha-required").removeClass("hideit");
                    }
                    jQuery("#task").val("default");
                } else {
                    // JEL 20091104 - take off leading zero if there is one
                    if (dsstk.charAt(0) === "0") {
                        dsstk = dsstk.slice(1);
                    }
                    var newWindow = window.open("go160w.pgm?task=noresults&MSDS=Y&term=" + dsstk, '_top');
                    //go160w.pgm?task=noresults&term=41739&MSDS=Y
                }
                jQuery("#msds_srch_btn").attr("disabled", "").css("display", "");
                jQuery("span[name=temp]").remove();
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                jQuery("#msds_srch_btn").attr("disabled", "").css("display", "");
                jQuery("span[name=temp]").remove();
                //alert("error thrown: " + XMLHttpRequest.responseText + " " + textStatus + " " + errorThrown);
            }
        });

    });
	
	// CDF 20090611 changed from button to input becuase of new button images
	jQuery('input[name="SearchCofA"]').click(function(){
		jQuery("#cofa_errmsg").html("");
        
        jQuery.ajax({
			type: "GET",
			url: "gd130w.pgm",
			dataType: "json",
			data: "task=ajax&itemnum=" + jQuery("#itemnum").val() + "&lot=" + jQuery('input[name="lot"]').val(),
			cache: false,
			success: function(rtnmsg)
			{
				if (typeof rtnmsg.error != "undefined")
				//if (rtnmsg.substr(0, 5) == "ERROR")
				{
					//rtnmsg = rtnmsg.substr(7, rtnmsg.length - 7);
					jQuery("#cofa_errmsg").html("<br />" + rtnmsg.error);
					tran_SwitchLang(curLang, "#cofa_errmsg");
				}
				else
				{
					jQuery("#cofa_form").attr("action", rtnmsg.path);
					jQuery("#cofa_form").submit();
				}
				
				
			}
		});
	});
	
}

function checkavail(obj, dsstk){	
	
	if (typeof dsstk == "undefined")
	{
		//alert("product number not submitted");
	}
	
	var row = jQuery(obj).parents("tr");
	
	// CDF 20090608 changed to only look at the first tr parent, not all the way up the tree
	row = row[0];
	
	var qty_input = jQuery(row).find('input[name="qty"]');
	var qty = jQuery(qty_input).val();
	var sizeid = jQuery(qty_input).attr("sizeid");
	var cat=jQuery(qty_input).attr("cat");
	sizeid = encodeURIComponent(sizeid);

	jQuery(row).find(".availibility").html("");	
	//if (qty > 0)
	//{
	// gp100w	 test	
	// KAB 20100217 - changed type from POST to GET for performance improvement
	// KAB 20100303 - converted simple "msg" response object to responseObj JSON object - also added
	//	 data type to ajax parms
	jQuery.ajax({
		url:"gp100w.pgm",
		type:"GET",
		cache:false,
		dataType: "json",
		data:"task=checkavail&dsstk=" + dsstk + "&size=" + sizeid + "&qty=" + qty + "&ajax=Y&cat="+cat,
		success:function(responseObj){
			if (responseObj.html.substr(0, 5) != "login")
			{
				jQuery(row).find(".availibility").html(responseObj.html);	
				contentheight();
				tran_SwitchLang(curLang , ".availibility");
			}
			else
			{
				msg = responseObj.html.substr(6, responseObj.html.length - 6);
				loadPopup(msg, 300, 75, 5000);
			}
		}
	});
	/*}
	else
	{
		var msg = "<span lang=\"Y\" key=\"please_enter_quantity\">Please enter a quantity.</span>";
		
		// KAB 20090721 - specify DSSTK as ID, otherwise will affect all message boxes
		//jQuery(".msgbox").html(msg);
		//tran_SwitchLang(curLang , ".msgbox");
		//jQuery(".msgbox").show(1);
		
		jQuery("#" + dsstk + " .msgbox").html(msg);
		tran_SwitchLang(curLang , "#" + dsstk + " .msgbox");
		jQuery("#" + dsstk + " .msgbox").show(1);
		
		timermsg = window.setTimeout("hidemsgbox('" + dsstk + "')", 5000);	
		contentheight();
	}*/
}

function addfav(item,sizeid,cat,curr){
	jQuery.ajax({
		url: "gp120w.pgm",
		type: "GET",
		cache: false,
		data: "task=addtofav&item="+item+"&sizeid=" + sizeid + "&cat="+cat+"&curr=" + curr,
		success: function(msg){
			if (msg == "")
			{   				
				msg = "<span lang=\"Y\" key=\"added_to_fav\">Item added to your favorites.</span>";
				
				// KAB 20090721 - specify DSSTK as ID, otherwise will affect all message boxes
				//jQuery(".msgbox").html(msg);
				//tran_SwitchLang(curLang , ".msgbox");
				//jQuery(".msgbox").show(1);
				
				//jQuery("#" + dsstk + " .msgbox").html(msg);
				jQuery("#" + item + " .msgbox").html(msg);
				//tran_SwitchLang(curLang , "#" + dsstk + " .msgbox");
				tran_SwitchLang(curLang , "#" + item + " .msgbox");
				//jQuery("#" + dsstk + " .msgbox").show(1);
				jQuery("#" + item + " .msgbox").show(1);
				timermsg = window.setTimeout("hidemsgbox('" + item + "')", 5000);				
			}		
			else
			{
				loadPopup(msg, 0, 0, 5000);
			}
		}
	});
}

function hidemsgbox(dsstk)
{
	window.clearTimeout(timermsg);
	jQuery("#" + dsstk + " .msgbox").hide(1);
}

function addcart(dsstk, qoe_dtl) {
	var sizeid;
	var cat;
	var curr;
	var data = "";
	var qtys = 0;
	var eqtys = 0;
	var row;
	var exportmsg = "";

    // JEL 20091117
    // prevent the function from continuing if the button is disabled
    if (jQuery("[name=addtocart]").attr("disabled") === true) {
        return;
    }

    jQuery("[name=addtocart]").attr("disabled", "disabled");
    jQuery("body").css("cursor", "wait");

	if (typeof qoe_dtl === "undefined") {
		qoe_dtl = {"": ""};
	}

	// KAB 20100217 - changed type from POST to GET for performance improvement
	jQuery.ajax({
		url:"go180w.pgm",
		cache:false,
		data:"task=checklogin",
		type:"GET",
		success: function (msg){
			if (msg == "") {
				jQuery("#" + dsstk).find('input[name="qty"]').each(function () {
					if (jQuery(this).val() != "") {

						row = jQuery(this).parent("td").parent("tr");
						sizeid = jQuery(this).attr("sizeid");
						// SJ 20130206 - encode size id for special characters
                                                sizeid=encodeURIComponent(sizeid);
						cat = jQuery(this).attr("cat");
						curr = jQuery(this).attr("curr");
						data += "&sizeid=" + sizeid + "&qty=" + jQuery(this).val() + "&cat=" + cat + "&curr=" + curr;

						if (jQuery(row).find('input[name="restr_msg"]').val() != "") {
							
							exportmsg += "Product: " + dsstk + "<br />";
							exportmsg += "Product size: " + jQuery(this).attr("sizedesc") + "<br />";
							exportmsg += "Restriction:" + jQuery(row).find('input[name="restr_msg"]').val() + "<br /><br />";
						}

						// count the empty quantity fields
						if (jQuery.trim(jQuery(this).val()) == "") {
							eqtys++;
						}
						//count all quantity fields
						qtys++;
					}
				});

				//if no quantity was entered and we are not coming from the quick order entry list view
				if (eqtys == qtys && qoe != "A") {
					msg = "<span lang=\"Y\" key=\"please_enter_quantity\">Please enter a quantity.</span>";
					loadPopup(msg, 0, 0, 5000);
					//alert("Please enter a quantity.");
					//if we are viewing the quick order entry single view return the string
					if (qoe == "S") {
						return "qty";
					}
				} else {//in all other cases
					var datastring = "task=addtocart&dsstk=" + dsstk + data;
					if (qoe == "S")
					{
						qoe_dtl.success = "success";
					}
					
					// if we have a restriction on the product (size level)
					if (exportmsg != "") {
						var qoe_dtl_str = "";
						//if the return url for the quick order entry is not empty, build the parameter list
						if (qoe_dtl.gotourl1 != "")
						{
							qoe_dtl_str = qoe_dtl.seq + "," + qoe_dtl.count + "," + qoe_dtl.numitem + "," + qoe_dtl.numitems + ",'" + qoe_dtl.gotourl1 + "','" + qoe_dtl.gotourl2 + "','" + qoe_dtl.success + "'";
						}
						
						exportmsg += "<span lang=\"Y\" key=\"add_product\">Do you want to add this product to the cart</span>?<br /><br />";
						exportmsg += "<input type=\"image\" onClick=\"expconfirm(true, '" + datastring + "', '" + dsstk + "', " + qoe_dtl_str + ")\" src=\"images/Yes.gif\" alttxt=\"yesbtn\" alt=\"Yes\" /> ";
						exportmsg += "<span lang=\"Y\" key=\"Yes\" class=\"hideit yesbtn\">Yes</span>";
						exportmsg += "<input type=\"image\" onClick=\"expconfirm(false, '" + datastring + "', '" + dsstk + "', " + qoe_dtl_str + ")\" src=\"images/No.gif\" alttxt=\"nobtn\" alt=\"No\" />";
						exportmsg += "<span lang=\"Y\" key=\"No\" class=\"hideit nobtn\">No</span>";
						
						msg = exportmsg;
						loadPopup(msg);
						btnimgalttxt("input", "btn");
						btnimgalttxt("input", "nobtn");
					} else {
						//if there are no restriction call this function
						addtocartajax(datastring, dsstk, qoe_dtl);
					}
					
					/*if (qoe == "S") {
						return "success";
					}*/
				}
			} else {
				loadPopup(msg, 0, 0, 5000);
			}
		
            // re-enable the button            
			// KAB 20130116 - changed method of enabling button
            //jQuery("[name=addtocart]").attr("disabled", "")
            jQuery("[name=addtocart]").removeAttr("disabled");

			jQuery("body").css("cursor", "auto");

		},
        error: function () {
            // re-enable the button, even on error
            jQuery("[name=addtocart]").attr("disabled", "");
            jQuery("body").css("cursor", "auto");
        }

	});
	
}

// called when product has a restriction on the size level and user clicks yes or no
function expconfirm(yesno, datastring, dsstk, seq, count, numitem, numitems, gotourl1, gotourl2, success)
{
	if (typeof seq === "undefined") {
		seq = 0;
	}
	if (typeof count === "undefined") {
		count = 0;
	}
	if (typeof numitem === "undefined") {
		numitem = 0;
	}
	if (typeof numitems === "undefined") {
		numitems = 0;
	}
	if (typeof gotourl1 === "undefined") {
		gotourl1 = "";
	}
	if (typeof gotourl2 === "undefined") {
		gotourl2 = "";
	}
	if (typeof success === "undefined") {
		success = "";
	}
	
	qoe_dtl = {
		"seq": seq,
		"count": count,
		"numitem": numitem,
		"numitems": numitems,
		"gotourl1": gotourl1,
		"gotourl2": gotourl2,
		"success": success
	}
	
	
	
	disablePopup();
	//DK added to hide iframe
	backgroundoverlayhide();
	
	if (yesno == true) {
		addtocartajax(datastring, dsstk, qoe_dtl);
	}
}

function addtocartajax(datastring, dsstk, qoe_dtl) 
{
	
	if (typeof qoe_dtl == "undefined") {
		qoe_dtl = {};
	}
	
	jQuery.ajax({
		url: carturl,
		type: "GET",
		cache: false,
		data: datastring,
		success: function (msg) {
			//if no error occured
			if (msg == "") {
				//if we are not coming from the quick order entry or it's from the single item view
				if (qoe == "" || qoe == "S") {
					// KAB 20090721 - specify DSSTK as ID, otherwise will affect all message boxes
					//jQuery(".msgbox").html("<span lang=\"Y\" key=\"added_to_cart\">Your item has been added to the cart.</span>");
					//tran_SwitchLang(curLang , ".msgbox");
					//jQuery(".msgbox").show(1);
					
					jQuery("#" + dsstk + " .msgbox").html("<span lang=\"Y\" key=\"added_to_cart\">Your item has been added to the cart.</span>");
					tran_SwitchLang(curLang , "#" + dsstk + " .msgbox");
					jQuery("#" + dsstk + " .msgbox").show(1);
					
					timermsg = window.setTimeout("hidemsgbox('" + dsstk + "')", 5000);
					// for the quick order entry, when quantities have been entered
					if (qoe_dtl.success == "success") {
                    
						//if it is the last item that has been added, redirect to the cart page
						if (qoe_dtl.numitem > 0 && qoe_dtl.numitem == qoe_dtl.numitems) {
							window.location.href = qoe_dtl.gotourl1; //"go180w.pgm?qoe=Y";
                            
						} else { // otherwise go to the next item
							window.location.href = qoe_dtl.gotourl2; //"go171w.pgm?seq=" + qoe_dtl.seq;
						}
					}
				}
				
				// if we are from the quick order entry list view
				if (qoe == "A") {
					//increase the counter of the current product
					qoecount++;
					//if the total number of products has been reached, redirect to the cart
					if (qoe_dtl.numitems == qoecount) {							
						window.location.href = qoe_dtl.gotourl1;
					} else { // otherwise call this function in quickorder.js again to add the next product to the cart
						makeajaxcall(qoe_dtl.numitems, qoecount);
					}
				}
				else
				{ //for all other circumstances, empty the quantity fields
					jQuery('input[name="qty"]').each(function () {
						jQuery(this).val("");
					});
				}
				
				// for all pages except the list view in the quick order entry, display minicart
				if (qoe == "" || qoe == "S") {
					
					// KAB 20130117 - do not retrieve minicart, not used in new design
					//getminicart();

					getcartitems();
				}
			}
			else
			{
				// display error
				loadPopup(msg, 0, 0, 5000);
			}
		}
	});
}

function addbulk(dsstk){
	
	jQuery.ajax({
		url: "gb100w.pgm",
		type: "GET",
		cache: false,
		data: "task=addtobulk&dsstk=" + dsstk,
		success: function(msg){
			
			jQuery("#" + dsstk + " .msgbox").html("<span lang=\"Y\" key=\"added_to_bulk\">This product has been added to the bulk request.</span>");
			
			tran_SwitchLang(curLang , "#" + dsstk + " .msgbox");
			
			jQuery("#" + dsstk + " .msgbox").show(1);
			timermsg = window.setTimeout("hidemsgbox('" + dsstk + "')", 5000);
			
			jQuery('input[name="qty"]').each(function(){
				jQuery(this).val("");
			});
			getminibulk();
			getbulkitems();
		}
	});
}

// KAB 20091016 - added "id" optional parm
function checkyourprice(id)
{
	var rows = 0;
	var erows = 0;
	
	// KAB 20091016 - added selector variable to handle optional id parm
	var selector = ".pricetable";
	if (typeof id != "undefined") 
	{
		selector = id + " " + selector;
	}
	
	// Loop through all pricing tables on the screen and hide "Your Price" column if this user
	//	does NOT have custom pricing.
	// KAB 20091016 - changed to use variable selector
	//jQuery(".pricetable").each(function(){
	jQuery(selector).each(function(){
		var ptbl = jQuery(this);
		
		rows = 0;

		// JRD 20110104 - added check for blank value to fix Your Price showing in error
		// KAB 20120711 - not working for some reason, replaced by more robust solutions with addition
		//	of "yourprice" class added to discount price values.
		/*
		erows = 0;
		jQuery(ptbl).find("tr:gt(0)").each(function(){
			if (jQuery.trim(jQuery(this).children("td:eq(2)").html()) == ""
			|| jQuery(this).children("td:eq(2)").html() == null
			|| jQuery.trim(jQuery(this).children("td:eq(2)").val()) == "")
			{
				erows++;
			}
			else
			{
				rows++;
				// JRD 20110104 
				//var bunk = jQuery.trim(jQuery(this).children("td:eq(2)").html());
				//var bunk = jQuery.trim(jQuery(this).children("td:eq(2)").val());
				//alert(bunk);
			}
		});
		*/

		// KAB 20120711 - check whether there are any discounted prices to be shown - if not, hide the column
		jQuery(ptbl).find('.yourprice').each(function ()
		{
			if (jQuery(this).text().trim() != '' && !isNaN(jQuery(this).text()))
			{
				// increment the counter of rows that have content
				rows++;
			}
		});

		// if there are no discount values to be displayed, hide the table column
		if (rows == 0)
		{
			jQuery(ptbl).find(".yourprice").html("");
			jQuery(ptbl).find(".yourprice").css("width", "0px");
		}
	});
	
}

function changecountry(obj, windowloc)
{
	var datastring = "task=chgcntr&udkey=" + jQuery(obj).val();
	jQuery.ajax({
		url: "gp100w.pgm",
		type: "GET",
		cache: false,
		data: datastring,
		success: function(){
			window.location.href = windowloc;
		}
	});
}

function filterResults(filterWhat){
	jQuery("#srchFilter").val(filterWhat);
	jQuery("#filterSearchResults").submit();
}

/* ]]> */