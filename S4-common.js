// active vertical tab (LI object index)
var activeTabIndex = -1;

// max characters (bytes) allowed in post data to the API
var maxCharsAllowed = 500;

// development environment indicator (string: full|labels|false) - get from cookie, override with parm
var development = getCookie('development');
if (development == null || getUrlParm('development') != undefined) 
{
	development = getUrlParm('development');
}
if (development != "full" && development != "labels") development = "false";
setCookie('development', development);

jQuery(document).ready(function()
{
	// include the header
	jQuery('#header').load('header.html', null, function()
	{
		
		// TODO: Get selected language. "en" is default
		selectedLanguage = '';
		
		// Get date and time from API call and populate header area
		clockTime.initDateTimeClock(selectedLanguage);
		
		// Get and display Logged In Username
		userAuthentication.getLoggedInUser();
		
		// Bind Logout link method
		jQuery('#logout').click( function()
		{
			userAuthentication.logUserOut();
		});
		
		// replace translations in dev environment
		devReplaceTranslations('#header');

		// initialize the 'update in progress' spinner popup and error popup, which are both included 
		//	in the header HTML
		initMeterChangePopups();
	});
	
});


/**
 * Finish off the styling for the VertTabs
 * This function must be called after the Custom User pages has been loaded.
 * This function is called in "customUserPages.populateCustomUserPagesSuccess"
 */
function finishVertTabStyles()
{
	// add jQuery UI tabs classes to horizontal and vertical tabs
	jQuery('#tabs, #verttabs').addClass('ui-tabs ui-widget ui-widget-content ui-corner-all');
	jQuery('#tabs ul, #verttabs > ul').addClass('ui-tabs-nav ui-helper-reset ui-helper-clearfix ui-widget-header ui-corner-all');
	jQuery('#tabs ul li, #verttabs > ul > li').addClass('ui-state-default ui-corner-top ui-tabs-active');
	jQuery('#tabs ul li a, #verttabs > ul > li > a').addClass('ui-tabs-anchor');
	
	// change classes on vertical tabs for correct layout
	$( "#verttabs").addClass( "ui-tabs-vertical ui-helper-clearfix" );
	$( "#verttabs > li" ).removeClass( "ui-corner-top" ).addClass( "ui-corner-left" );

	// set hover styling on tabs
	jQuery('#tabs > ul > li, #verttabs > ul > li').hover(function ()
	{
		jQuery(this).addClass('ui-state-hover');
	}, 
	function ()
	{
		jQuery(this).removeClass('ui-state-hover');
	});

	// handle vertical tab click events and click first tab
	verticalTabs('0');

	// any events or changes that may need to be repeated when a portion of the page is changed via ajax
	onloadAjax();
}


/**
 * Events and actions to be taken when a portion of the page is changed by ajax.
 * 
 * This function is purely for encapsulation of the kind of code that would normally be
 *	in the document onload function, but may also affect page elements that change via
 *	ajax.
 * 
 */
function onloadAjax()
{
	// add alternating classnames to data table rows, for zebra striping
	jQuery('.datatable tr:even, .formtable tr:even').addClass('altrow');

	// initialize accordions
	jQuery('.accordion').accordion(
	{
		collapsible: true,
		heightStyle: 'content'
	});

	devReplaceTranslations();

	// set width on submit buttons, so that centering works correctly in IE8
	//	note - this needs to happen after translations are replaced via devReplaceTranslations() so that
	//	we have the correct width for various translations of the word "Apply"
	jQuery(':submit').each(function ()
	{
		jQuery(this).css('width', jQuery(this).outerWidth() + 'px');
	});

}

/**
 * Initialize vertical tabs.
 * 
 * @param string clickTabByIndex - the index of the verticle tab to be auto-clicked.
 */
function verticalTabs(clickTabByIndex)
{
	// hijack click event on links, get URL, and load it in container via ajax instead of redirecting to page.
	jQuery('#verttabs a').click(function ()
	{
		// clear the ajax timer that reloads reports on an interval
		clearTimeout(requestTimer);						

		// load waiting spinner in main content area
		jQuery('#content').html(jQuery('#waiting-master > div').clone());

		// get URL from link
		var url = jQuery(this).attr('href');

		// determine active tab (highest-level tab in vertical tabs); if this is a submenu, set this to parent tab
		var tab = jQuery(this).closest('li', '#verttabs');
		if (jQuery(tab).parent().closest('li', '#verttabs').size())
		{
			tab = jQuery(tab).parent().closest('li', '#verttabs');
		}
		var tabIndex = jQuery(tab).index();


		// if active tab has changed, add/remove class markers and set as active tab
		if (activeTabIndex != tabIndex)
		{
			jQuery('#verttabs li').removeClass('ui-state-active ui-state-hover');
			jQuery(tab).addClass('ui-state-active ui-state-hover');			

			// hide submenu of old active tab if applicable
			jQuery('#verttabs > ul > li > ul').hide();

			activeTabIndex = tabIndex;
		}

		/* check if there is a submenu, in which case:
			a) load the first link from that instead
			b) show the submenu
		*/
		if (jQuery(this).closest('li').find('ul').size() > 0)
		{
			// get first submenu's link
			var url = jQuery(this).closest('li').find('ul li a').first().attr('href');

			// show the submenu
			jQuery(this).closest('li').find('ul').show();

			// handle active marker on submenu items
			submenus();
		}

		// load the main container via ajax
		jQuery('#content').load(url, null, function ()
		{
			// any events or changes that may need to be repeated when a portion of the page is changed via ajax
			onloadAjax();

		});

		// return false to cancel redirect to page (ie: normal anchor functionality)
		return false;
	});
	
	// Invoke the click event for the specified vertical tab index.
	if(clickTabByIndex)
	{
		// click first tab to load data
		jQuery('#verttabs > ul > li > a').eq(clickTabByIndex).click();
	}
}

/**
 * Replace translation markers in development environment.
 *
 * Find and replace all WindMark markers in the following form, with their
 *	untranslated (ie: English) descriptions:
 *
 *	$%localizedString(Temperature Min)#$
 *
 * This would be replaced by "Temperature Min".
 * 
 * @parm selector CSS selector of DOM object to scan and replace
 */
function devReplaceTranslations(selector)
{
	// only continue if we are in the development environment
	if (development == "false")
	{
		return;
	}

	// if no selector is specified, search entire document (ie: body)
	if (selector == null || selector == '')
	{
		selector = 'body';
	}

	// find all DOM elements that have the placeholder text in them (include all submit buttons)
	var arrElements = jQuery(selector).find(':contains("localizedString"), :submit');

	// for each object, remove beginning and end of placeholder, leaving only label text
	jQuery(arrElements).each(function ()
	{

		// for submit buttons, remove placeholder text on "value" element, leaving only English label
		if (jQuery(this).is(':submit'))
		{
			strText = jQuery(this).val();
			strText = strText.replace('$%localizedString(', '');
			strText = strText.replace(')#$', '');
			jQuery(this).val(strText);
		}
		else
		{
			// find text-type content nodes (ie: the actual text) and wrap it in a span
			//	to be able to manipulate it
			var strText = jQuery(this).contents().filter(function() {
			  return this.nodeType == 3;
			}).wrap('<span class="tempDevClass"></span>');
			var objTextWrapper = jQuery(this).find('.tempDevClass');

			// remove placeholder localization text, leaving only the English label
			var strText = jQuery(objTextWrapper).text();
			strText = strText.replace('$%localizedString(', '');
			strText = strText.replace(')#$', '');
			jQuery(objTextWrapper).text(strText);

			// remove temporary wrapper from around text
			jQuery(objTextWrapper).contents().filter(function() {
				return this.nodeType === 3;
			}).unwrap();
		}


		/* Coding Notes:
			- Just using .text() on matching elements replaces too much content when 
				dealing with parent objects, such as the UL element of tabs when what we 
				are actually dealing with is the A element several levels down. That is 
				why we find true text nodes (nodeType = 3).
			- The simple solution of .text() unfortunately replaces sibling elements along
				with text, such as the arrow image on accordions. That is why we wrap 
				the text in tempDevClass.
		*/
	});

}

/**
 * Get parameter from GET parms in URL.
 * 
 * @parm parmName Parameter name in URL.
 * @return Value of the parameter.
 */
function getUrlParm(parmName)
{
	var strParms = window.location.search.substr(1);
	var arrParms = strParms.split ("&");
	var params = {};

	for ( var i = 0; i < arrParms.length; i++) {
		var arrTemp = arrParms[i].split("=");
		params[arrTemp[0]] = arrTemp[1];
	}

	return params[parmName];
}

/**
 * Set a browser cookie.
 * 
 * @parm c_name Cookie name.
 * @parm c_value Cookie value.
 * @parm optional extdays Number of days until expiry.
 */
function setCookie(c_name,value,exdays)
{
	var exdate=new Date();
	exdate.setDate(exdate.getDate() + exdays);
	var c_value=escape(value) + ((exdays==null) ? "" : "; expires="+exdate.toUTCString());
	document.cookie=c_name + "=" + c_value;
}

/**
 * Get value of a browser cookie.
 * 
 * @parm c_name Cookie name.
 * @return Value of the cookie, or null if no cookie exists.
 */
function getCookie(c_name)
{
	var c_value = document.cookie;
	var c_start = c_value.indexOf(" " + c_name + "=");
	if (c_start == -1)
	{
		c_start = c_value.indexOf(c_name + "=");
	}
	if (c_start == -1)
	{
		c_value = null;
	}
	else
	{
		c_start = c_value.indexOf("=", c_start) + 1;
		var c_end = c_value.indexOf(";", c_start);
		if (c_end == -1)
		{
			c_end = c_value.length;
		}
		c_value = unescape(c_value.substring(c_start,c_end));
	}
	return c_value;
}

/**
 * Return the value of a data object, from an array of data objects.
 *
 * Helper function to limit code duplication and perform minor validation that data exists. Anticipated
 *	primary use is with the "values" array returned by call to GetRegisterValues API method.
 * 
 * @parm array arrData - the array containing returned data objects, indexed in the order they were requested.
 * @parm String index - the index of the register we want.
 * @parm String regName - Optional, the name of the register to find (used in dev only) 
 * @return Object {value, units} - The contents of the "value" and "units" properties of the register.
 */
function getDataValue(arrData, index, regName)
{	
	var returnObj = {};

	// in full development (ie: dummy data), get the data by name, not index
	// update: do this in production and development, since the index is not reliable with error messages
	//	 interspersed in results set.
	//if (development == "full" && regName != null)
	if (regName != null)
	{
		var result = [];
		result = jQuery.grep(arrData, function(element, index)
			{ 
				if (element.name == regName) return true;
				if (element.label == regName) return true;
			});
		if (result.length > 0) 
		{
			// set value
			returnObj.value = result[0].value;

			// set units if they exist (the property may not exist at all)
			if (result[0].units != undefined) returnObj.units = result[0].units;
		}
		else 
		{
			returnObj.value = "-";
			returnObj.units = "";
		}
	}

	// get the data in the requested position in live environment
	else if (development != "full" && arrData && index >= 0 && arrData.length > index)
	{
		returnObj.value = arrData[index].value;

		// set units if they exist (the property may not exist at all)
		if (arrData[index].units != undefined) returnObj.units = arrData[index].units;
	}

	// if all else fails, return blank values
	else
	{
		returnObj.value = "-";
		returnObj.units = "";
	}

	// return the object containing value and units properties
	return returnObj;
}

/**
 * Build string to submit to getRegisterValues
 *
 * Helper function to build string listing register names, to submit to getRegisterValues API 
 *	method, in the following format:  
 *	
 *		{"names":["regString1", "regString2",...]}
 * 
 * @parm string strContainerSelector - selector string for DOM element containing table to update.
 * @return String - The formatted string ready to submit to getRegisterValues API method
 */
function buildStringGetRegister(strContainerSelector)
{
	// create array of register names from "regname" and "name" attributes on table
	var arrRegNames = [];
	arrRegNames = jQuery(strContainerSelector + ' [regname], ' + strContainerSelector + ' [name]').map(function ()
	{
			if (jQuery(this).attr('regname') != null) return jQuery(this).attr('regname');
			else return jQuery(this).attr('name');
	});
	arrRegNames = arrRegNames.toArray();

	if (arrRegNames)
	{
		// create object in desired structure, then convert to JSON notation
		var objRequest = {};
		objRequest.names = arrRegNames;
		return JSON.stringify(objRequest);

	}
	else
	{
		return "";
	}
}



/**
 * Build a string containing the JSON markup to submit to the setRegisterValues API call. Only send registers
 *	that have been changed by the user.
 *
 * Helper function to form a string containing JSON markup specific to the setRegisterValues API call, in 
 *	this form:
 *		{
 *			"values":
 *				[
 *					{
 *						"name": "registerString1",
 *						"value": "registerValue1",
 *						"units": "registerUnits1"
 *					},
 *					{
 *						"name": "registerString2",
 *						"value": "registerValue2",
 *						"units": "registerUnits2"
 *					},
 *					...
 *				]
 *		}
 *
 * 
 * @parm string strContainerSelector - selector for the form object to convert to JSON string.
 * @return String A string in JSON notation to send to the setRegisterValues API call.
 */
function buildStringSetRegister(strContainerSelector)
{
	if (strContainerSelector)
	{

		var jsonString = '';
		var singleElem = '';

		// serialize form data into an array
		var arrFormData = jQuery(strContainerSelector).find('[changed="true"]').serializeArray();

		if (arrFormData)
		{
			// create object in desired structure, then convert to JSON notation
			var objRequest = {};
			objRequest.values = arrFormData;
			return JSON.stringify(objRequest);

		}
		else
		{
			return "";
		}

	}
}

/**
 * Populate register values on page. This function is for encapsulation of common code. 
 * 
 * Populate register values on page, in both table data, form field values, and any other static
 *	text on the page.
 *
 * @parm array data - The JSON object sent back from device by API call, listing register values.
 * @parm array strRegisterNames - The list of register names sent to the device via API call (string representation of JSON object).
 * @parm string paneID - ID of the pane being updated; used to prevent other registers accidentally updating.
 * @parm [optional] boolean wrapUnits - Wrap units in parentheses or not.
 */
function populateRegisterValuesOnPage(data, strRegisterNames, paneID, wrapUnits)
{
	// check that API results are as expected, otherwise leave this function
	if (data.result == undefined) return;

	// default wrapUnits flag to false (ie: don't wrap units in parentheses)
	if (wrapUnits == undefined) wrapUnits = false;

	// get register list (array) of strings
	var arrRegNames = "";
	if (strRegisterNames.length > 0) arrRegNames = jQuery.parseJSON(strRegisterNames).names;

	// since there is only one parent "values" object in this data object, set to "data" to 
	//	simplify subsequent code
	data = data.result;

	// init variables to hold API register contents
	var registerContents, dataValue, units;

	// populate table or form fields with data, by looping through each requested register value 
	//	and finding its corresponding value in the returned data object
	jQuery(arrRegNames).each(function (index, regName)
	{
		registerContents = {};
		dataValue = '';
		units = '';

		// get data value from API response
		registerContents = getDataValue(data, index, regName);
		dataValue = registerContents.value;
		units = registerContents.units;
		
		// populate element text (ie: table data)
		jQuery('#' + paneID + ' [regname="' + regName + '"]').text(dataValue);	

		// populate form field
		jQuery('#' + paneID + ' [name="' + regName + '"]').val(dataValue);	

		// update the units label (if the data exists and if there is a container for it)
		if (units != '' && units != undefined) 
		{
			var unitText = units;
			if (wrapUnits) unitText = "(" + unitText + ")";
			jQuery('[unitsreg="' + regName + '"]').text(unitText);	
		}
	});

}


/**
 * Populate dropdowns on page with returned values (aka enumerations). This function is for 
 *	encapsulation of common code.
 *
 * @parm array data - The JSON object sent back from device by API call, listing possible values for registers.
 * @parm array strRegisterNames - The list of register names sent to the device via API call (string representation of JSON object).
 */
function populateDropdowns(data, strRegisterNames)
{

	
	// only continue if data is as expected
	if (!data.result) return;
	
	// get register list (array) of strings
	var arrRegNames = [];
	if (strRegisterNames.length > 0) arrRegNames = jQuery.parseJSON(strRegisterNames).names;

	// since there is only one parent "values" object in this data object, set to "data" to 
	//	simplify subsequent code
	data = data.result;

	
	// populate dropdowns with data, by looping through each requested register value and finding
	//	the corresponding array of possible values
	for(var i=0;i<arrRegNames.length;i++) {
		
		// loop through the list of values for this register and add to dropdown object on page
		jQuery.each(data, function (k,v)
		{
			// Each key/value contains drop down list items
			// [[[name],[value]], [[name],[value]]]
			
			// Iterate each drop down item
			jQuery.each(v, function (key, dataValue)
			{
				// If the Drop Down Name matches the Register Name, populate the Drop Down Menu!
				if(dataValue.name == arrRegNames[i]) {
					jQuery('[name="' + arrRegNames[i] + '"]').append('<option value="' + dataValue.value + '">' + dataValue.value + '</option>');
				}
			});
		});
		
	}
	
}


/**
 * userAuthentication is used to fetch, store, and display the currently logged in user,
 * and log the User out.
 */
var userAuthentication = {
	
	loggedInUser: '',
	
	// Fetch the logged in User's Username
	getLoggedInUser: function()
	{
		// Compose Request Object
		var reqLoggedInUserObject = ({
			type: 'GET',
			url: '/api/getLoggedInUser',
			serializedData: '',
			returnType: 'json',
			successCallback: userAuthentication.getUserSuccess,
			failCallback: userAuthentication.getUserFail
		});

		pmAjax.sendRequest(reqLoggedInUserObject);
	},
	
	
	// Display the logged in User's username in the page header
	getUserSuccess: function (data, strRegisterNames)
	{
		// Extract Usrename
		userAuthentication.loggedInUser = data['userName'];
		
		// Update Header with Logged In Username
		jQuery('#loggedInUsername').html(userAuthentication.loggedInUser);
		
	},
	
	
	// Display nothing for a failed GetLoggedInUser request
	getUserFail: function ()
	{
		// TODO: Handle failing getLoggedInUser request
		jQuery('#loggedInUsername').html('');
	},
	
	
	// Call API to Logout the User
	logUserOut: function()
	{
		// Compose Request Object
		var reqLoggedInUserObject = ({
			type: 'POST',
			url: '/api/userLogout',
			serializedData: '',
			returnType: 'json',
			successCallback: userAuthentication.logUserOutSuccess,
			failCallback: userAuthentication.logUserOutFail
		});

		pmAjax.sendRequest(reqLoggedInUserObject);
	},
	
	
	// Successfully logged out User is redirected to Logon page
	logUserOutSuccess: function()
	{
		// Forward user out to Login Screen
		window.location = "../logon.html";
	},
	
	
	// Log User Out Fail callback
	logUserOutFail: function ()
	{
		// TODO: Handle failed request
	}
	
}


/**
 * Updates the ClockTime found in the page Header.
 * Re-Synchronizes the time every minute with the Register Value. 
 */
var clockTime = {
	
	// Set Clock Time Interval Object, Interval Counter, and Inteval Limit
	// Create new Moment.js object
	momentTime: moment(),
	runningClock: '',
	intervalCounter: 0,
	intervalLimit: 59,
	regional: '',
	
	// Initialize and run the clock
	initDateTimeClock: function(language) {
		
		// Extract PM Language String cookie value
		language = getCookie('pmLanguageString');
		
		// Set Language if provided
		if(language != '')
		{
			clockTime.regional = language;
		}
		else
		{
			clockTime.regional = "en";
		}
		
		// Create new date object
		clockTime.fetchDateRegisterValue();
		
	},
	
	
	// Fetch the Timestamp stored in the Register
	fetchDateRegisterValue: function ()
	{
		// get register values to pre-populate form
		var strRegisterNames = '{"names":["CL1 UnivTime"]}';
	
		// Compose Request Object
		var reqRegisterObject = ({
			type: 'POST',
			url: '/api/registerValues/getRegisterValues',
			serializedData: strRegisterNames,
			returnType: 'json',
			successCallback: clockTime.getClockTimeSuccess,
			failCallback: clockTime.getClockTimeFail
		});
	
		pmAjax.sendRequest(reqRegisterObject);
		
	},
	
	
	// Fetch Date Register Value success callback
	getClockTimeSuccess: function (data, reqObj)
	{
		// Extract the 'CL1 UnivTime' value
		var registerDate = data['result'][0]['value'];
		
		// Set new Date object
		var timestamp = new Date(registerDate * 1000);
		
		// Verify that the Timestamp is valid Unix Time
		if(clockTime.momentTime.isValid(timestamp))
		{
			// Run the ClockTime clock
			clockTime.runClockTime(timestamp);
		}
		else
		{
			// Failed: retry initDateTimeClock() request in 60 seconds
			clockTime.getClockTimeFail();
		}
	},
	
	
	// Get Clock Time fail handler
	getClockTimeFail: function ()
	{
		// Display empty time
		$('#datetime').html('-');
		
		// Retry Clock Time request in 60 seconds.
		var retry = setTimeout(function () { clockTime.initDateTimeClock(clockTime.regional) }, 60000);
	},
	
	
	/**
	 * Run the Clock Time starting at provided Timestamp
	 * The clock is re-synchronized with the register value every 60 seconds
	 *
	 * @param string timestamp - the Unix Epoch timestamp fetched from the register.
	 */
	runClockTime: function(timestamp)
	{
		// Clear ClockTime Interval if it exists.
		clockTime.clearClockTimeInterval();
		
		var unixTimestamp = timestamp;
		
		// Update Clock Time every second
		// Re-Synchronize clock every 60 seconds
		clockTime.runningClock = setInterval(function() {
			
			// Display i18n Date and Time
			$('#datetime').html(localTimestamp.localizeTime(unixTimestamp, 'MMMM D YYYY, HH:mm:ss', clockTime.regional));
			
			// Increment Unix Timestamp by 1 second
			unixTimestamp += 1000;
			
			// Increment Counter
			clockTime.intervalCounter++;
			
			// Fetch current date from Register if necessary (every minute)
			if(clockTime.intervalCounter > clockTime.intervalLimit)
			{
				unixTimestamp = clockTime.fetchDateRegisterValue();
				clockTime.intervalCounter = 0; // Reset counter.
			}
			
		}, 1000);
	},
	
	
	// Clear the runningClock Interval if necessary
	clearClockTimeInterval: function()
	{
		// Clear ClockTime Interval if it exists.
		if(clockTime.runningClock != '')
		{
			clearInterval(clockTime.runningClock);
		}
	}
}


// Generate a localized timestamp
var localTimestamp = {
	
	/**
	 * Convert a Unix Timestamp to readable string
	 *
	 * @param string unixTimestamp - the Unix Timestamp to be converted
	 * @param string formatString - defines the date format
	 * @param string language - specify the language code to further refine formatString
	 */
	localizeTime: function(unixTimestamp, formatString, language)
	{
		// Set formatString if not provided
		if(formatString == '')
		{
			formatString = 'MMMM D YYYY, HH:mm:ss';
		}
		
		// Set language if not provided
		if(language == '')
		{
			language = 'en';
		}
		
		// Construct moment object, set time, and define language
		mTime = moment();
		mTime.unix(unixTimestamp);
		mTime.lang(language);
		
		// Return i18n Date and Time
		return mTime.format(formatString).toString();
	}
	
}


// Populate the Vertical Tab Menu with Custom User Pages
var customUserPages = {
	
	/**
	 * Get Custom User pages for provided Section
	 *
	 * @param string sectionTitle - the Title of the section (Monitoring, Control, Diagnostics, or Setup)
	 */
	populateCustomUserPagesForSection: function (sectionTitle)
	{
		
		// Compose Request Object for Register values
		var reqCustomUserPagesObject = ({
			type: 'GET',
			url: '/api/customPages/'+ sectionTitle,
			serializedData: '',
			returnType: 'json',
			successCallback: customUserPages.populateCustomUserPagesSuccess,
			failCallback: customUserPages.populateCustomUserPagesFail
		});
		
		// Request values for Registers
		pmAjax.sendRequest(reqCustomUserPagesObject);
		
	},
	
	
	// Populate Custom User Pages Success callback
	populateCustomUserPagesSuccess: function (data, reqObj)
	{
		// Append each Custom Page to the Verttab Menu
		jQuery.each(data.result, function(item,value) {
			jQuery('#verttabs > ul').append('<li><a href="'+ value.linkUrl +'">'+ value.displayName +'</a></li>');
		});
		
		// 
		finishVertTabStyles();
	},
	
	
	// Populate Custom User Pages Fail callback
	populateCustomUserPagesFail: function ()
	{
		// TODO - error handling
	}
	
}


/**
 * Handle submenu highlighting.
 */
function submenus()
{
	// set initial active menu to first one (and clear others)
	jQuery('.submenu').each(function ()
	{
		jQuery(this).find('li').removeClass('active');
		jQuery(this).find('li:first').addClass('active');
	});

	// set active flag (class="active") on clicked submenu event
	jQuery('.submenu a').click(function ()
	{
		// remove active marker on any previously-clicked item in this menu
		jQuery(this).closest('.submenu').find('li').removeClass('active');

		// add active marker to this item
		jQuery(this).closest('li').addClass('active');
	});
}


/**
 * Initialize the popup for UI feedback that data on the meter is being updated.
 *
 */
function initMeterChangePopups()
{
	// init a modal popup with no controls, only a spinner (HTML found in header.html)
	jQuery('#updateInProgress').dialog({
		modal: true,
		draggable: false,
		dialogClass: 'noHeader',
		autoOpen: false
	});

	// init a modal popup that displays the error message and an OK button (HTML found in header.html)
	jQuery('#updateError').dialog({
		modal: true,
		draggable: false,
		autoOpen: false,
		buttons: [{ 
			text: tranOK, 
			click: function() 
			{ 
				jQuery(this).dialog("close"); 
			}
		}]
	});

}

/**
 * Display UI feedback that data on the meter is being updated.
 *
 */
function displayMeterChangeInProgress()
{
	// show a modal popup with no controls, only a spinner
	jQuery('#updateInProgress').dialog('open');

}

/**
 * Complete/hide the UI feedback that data on the meter is being updated.
 *
 */
function completeMeterChangeInProgress()
{
	// hide the modal popup that was showing a spinner
	jQuery('#updateInProgress').dialog('close');

}

/**
 * UI feedback when meter update fails
 *
 */
function meterUpdateFailed()
{
	// hide the modal popup that was showing a spinner
	jQuery('#updateInProgress').dialog('close');

	// show the popup that says there was an error
	jQuery('#updateError').dialog('open');


}
