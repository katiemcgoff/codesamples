// string (JSON) containing list of register names to pass to API for each table (global for re-use w. ajax updates)

// Set up individual Global variable for each Accordion Pane
var strGlobalRegistersBasicReadings = "";
var strGlobalRegistersEnergyReadings = "";
var strGlobalRegistersDemandReadings = "";
var strGlobalRegistersVoltageReadings = "";
var strGlobalRegistersPowerQuality = "";
var strGlobalRegistersInputs = "";
var strGlobalRegistersOutputs = "";

/**
 * Instantaneous Readings setup method.
 */
function initInstantaneousReadings()
{
	// init first table in accordion - Basic Readings
	getBasicReadings();
	
	// Bind event to populate Accordion Children when they are Clicked
	bindAccordionPaneChildren();
	
}

/**
 * Dynamically bind event for each Accordion pane
 * Used to populate Accordion Pane with content on demand.
 */
function bindAccordionPaneChildren() {
	// Bind onClick event for each Accordion header elemenent
	jQuery("div.accordion > h3").each( function()
	{
		var eTarget = jQuery(this).attr('target');
		jQuery(this).bind('click', function()
		{
			updatePaneContentByTarget(eTarget, jQuery(this).attr("id"));
		});
	});
}


/**
 * Update Appropriate Pane Content
 */
function updatePaneContentByTarget(paneTarget, eID)
{
	// Determine if Pane is already selected
	var isSelected = jQuery('#'+ eID).hasClass('ui-accordion-header-active');
	
	// If the Pane is not selected, populate it.
	if(!isSelected) {
		
		// Populate appropriate pane.
		switch(paneTarget)
		{
			case 'basic-readings':
				getBasicReadings();
				break;
			case 'energy-readings':
				getEnergyReadings();
				break;
			case 'demand-readings':
				getDemandReadings();
				break;
			case 'voltage-readings':
				getVoltageReadings();
				break;
			case 'power-quality':
				getPowerQuality();
				break;
			case 'inputs':
				// TODO: Add Inputs function
				break;
			case 'outputs':
				// TODO: Add Outputs function
				break;
			case 'voltageDisturbances':
				powerQualitySummary.getIticSemiReadings();
				break;
			default:
				// Default: Do nothing.
				break;
		}
	}
}


/**
 * Basic Readings report data retrieval.
 *
 * Call API method getRegisterValues and populate page contents with data.
 * 
 */
function getBasicReadings()
{
	// build formatted string to submit to API call, listing register names - may have been built by
	//	previous call to this function, in which case re-use it.
	if (strGlobalRegistersBasicReadings == "") strGlobalRegistersBasicReadings = buildStringGetRegister('#basic-readings');	
	strRegisterNames = strGlobalRegistersBasicReadings;
	
	// Compose Request Object
	var reqObject = ({
		type: 'POST',
		url: '/api/registerValues/getRegisterValues',
		serializedData: strRegisterNames,
		returnType: 'json',
		successCallback: successResponse,
		failCallback: basicReadingsFail,
		elementID: 'basic-readings',
		updateOnInterval: true
	});
	
	// call getRegisterValues API method
	pmAjax.sendRequest(reqObject);
}

/**
 * Process data response for Basic Readings table.
 *
 * @parm array data - The JSON object sent back from device by API call, listing register values.
 * @parm array strRegisterNames - The list of register names sent to the device via API call (string representation of JSON object).
 * @parm string objID - defines ID for the selected pane to be populated.
 */
function successResponse(data, reqObj)
{
	// populate register values and units on page with returned data
	var wrapUnits = true;
	populateRegisterValuesOnPage(data, reqObj.serializedData, reqObj.elementID, wrapUnits);
}

function basicReadingsFail(textStatus, errorThrown)
{
	// TODO - error handling
}


/**
 * Energy Readings report data retrieval.
 *
 * Call API method getRegisterValues and populate page contents with data.
 * 
 */
function getEnergyReadings()
{
	// build formatted string to submit to API call, listing register names - may have been built by
	//	previous call to this function, in which case re-use it.
	if (strGlobalRegistersEnergyReadings == "") strGlobalRegistersEnergyReadings = buildStringGetRegister('#energy-readings');	
	strRegisterNames = strGlobalRegistersEnergyReadings;
	
	// Compose Request Object
	var reqObject = ({
		type: 'POST',
		url: '/api/registerValues/getRegisterValues',
		serializedData: strRegisterNames,
		returnType: 'json',
		successCallback: successResponse,
		failCallback: energyReadingsFail,
		elementID: 'energy-readings',
		updateOnInterval: true
	});
	
	// call getRegisterValues API method
	pmAjax.sendRequest(reqObject);
}

function energyReadingsFail(textStatus, errorThrown)
{
	// TODO - error handling
}


/**
 * Demand Readings report data retrieval.
 *
 * Call API method getRegisterValues and populate page contents with data.
 * 
 */
function getDemandReadings()
{
	// build formatted string to submit to API call, listing register names - may have been built by
	//	previous call to this function, in which case re-use it.
	if (strGlobalRegistersDemandReadings == "") strGlobalRegistersDemandReadings = buildStringGetRegister('#demand-readings');
	strRegisterNames = strGlobalRegistersDemandReadings;
	
	// Compose Request Object
	var reqObject = ({
		type: 'POST',
		url: '/api/registerValues/getRegisterValues',
		serializedData: strRegisterNames,
		returnType: 'json',
		successCallback: successResponse,
		failCallback: demandReadingsFail,
		elementID: 'demand-readings',
		updateOnInterval: true
	});
	
	// call getRegisterValues API method
	pmAjax.sendRequest(reqObject);
}

function demandReadingsFail(textStatus, errorThrown)
{
	// TODO - error handling
}


/**
 * Voltage Readings report data retrieval.
 *
 * Call API method getRegisterValues and populate page contents with data.
 * 
 */
function getVoltageReadings()
{
	// build formatted string to submit to API call, listing register names - may have been built by
	//	previous call to this function, in which case re-use it.
	if (strGlobalRegistersVoltageReadings == "") strGlobalRegistersVoltageReadings = buildStringGetRegister('#voltage-readings');
	strRegisterNames = strGlobalRegistersVoltageReadings;
	
	// Compose Request Object
	var reqObject = ({
		type: 'POST',
		url: '/api/registerValues/getRegisterValues',
		serializedData: strRegisterNames,
		returnType: 'json',
		successCallback: successResponse,
		failCallback: voltageReadingsFail,
		elementID: 'voltage-readings',
		updateOnInterval: true
	});
	
	// call getRegisterValues API method
	pmAjax.sendRequest(reqObject);
}

function voltageReadingsFail(textStatus, errorThrown)
{
	// TODO - error handling
}


/**
 * Process data response for Power Quality table.
 *
 * @parm array data - The JSON object sent back from device by API call, listing register values.
 * @parm array strRegisterNames - The list of register names sent to the device via API call (string representation of JSON object).
 */
function getPowerQuality(data, strRegisterNames)
{
	// build formatted string to submit to API call, listing register names - may have been built by
	//	previous call to this function, in which case re-use it.
	if (strGlobalRegistersPowerQuality == "") strGlobalRegistersPowerQuality = buildStringGetRegister('#power-quality');
	strRegisterNames = strGlobalRegistersPowerQuality;
	
	// Compose Request Object
	var reqObject = ({
		type: 'POST',
		url: '/api/registerValues/getRegisterValues',
		serializedData: strRegisterNames,
		returnType: 'json',
		successCallback: successResponse,
		failCallback: powerQualityFail,
		elementID: 'power-quality',
		updateOnInterval: true
	});
	
	// call getRegisterValues API method
	pmAjax.sendRequest(reqObject);

}

function powerQualityFail(textStatus, errorThrown)
{
	// TODO - error handling
}
