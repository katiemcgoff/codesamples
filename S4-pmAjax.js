// global timer object to manage requests
var requestTimer = null;

// set the reload interval in milliseconds
var reloadReportInterval = 1000;

// global object to track the latest API request (only for repeating requests)
var activeRequest = null;

var pmAjax = {
	sendRequest:function(reqObj) {


		// list of all registers as array (handle "values" element from setRegister and "names" from other requests
		var arrAllRegisters = [];
		if (reqObj.serializedData.length > 0) 
		{
			if (reqObj.url.indexOf('setRegister') >= 0) arrAllRegisters = jQuery.parseJSON(reqObj.serializedData).values;
			else arrAllRegisters = jQuery.parseJSON(reqObj.serializedData).names;
		}


		// object containing accumulated data, built by calls to sendBatchRequest()
		var objData = {};
		objData.result = null;

		// running markers to keep track of how many registers we've processed
		var lastRegisterIndex = arrAllRegisters.length - 1;

		// attempt to process the whole list of registers the first time sendBatchRequest() is called
		var startRegisterIndex = 0;
		var endRegisterIndex = lastRegisterIndex;


		function sendBatchRequest()
		{
			if (reqObj.type == "POST")
			{
				// construct the list of registers to process from the running index markers
				var arrRegisters = [];
				if (arrAllRegisters.length > endRegisterIndex)
				{
					arrRegisters = arrAllRegisters.slice(startRegisterIndex, endRegisterIndex + 1);
				}

				// only continue if this list of registers is populated
				if (arrRegisters.length <= 0) return;
				

				// check whether this list of registers is small enough to process
				objPostData = {};
				if (reqObj.url.indexOf('setRegister') >= 0) objPostData.values = arrRegisters;
				else objPostData.names = arrRegisters;
				strData = JSON.stringify(objPostData);

				// this string is small enough to process, so continue
				if (strData.length <= maxCharsAllowed)
				{
					// update the index markers so that the next batch gets processed
					startRegisterIndex = endRegisterIndex + 1;
					endRegisterIndex = lastRegisterIndex;

				}
				// the register string is too big, so half it and try again
				else
				{
					endRegisterIndex = Math.floor((endRegisterIndex - startRegisterIndex)/2) + startRegisterIndex;
					sendBatchRequest();
					return;
				}
			}
			else
			{
				strData = '';
			}

			
			var request = $.ajax({
				type: reqObj.type,
				url: reqObj.url,
				data: strData,
				dataType: 'text', //needs to be reqObj.returnType which is generally going to be "json", however unwrapped FAIL values break this right now.
				cache:false,
				xhrFields: { withCredentials: true },
				beforeSend: function(xhr)
				{
					// Renew existing Cookies
					xhr.setRequestHeader('Set-Cookie', document.cookie);
				}
			});
			request.done(function(data) {

				// flag to check whether the request failed on a technical issue, in which case we skip
				// it completely
				var requestFailed = false;
	
				// wrap FAIL values in double quotes
				data = data.replace(/:FAIL/g,":\"FAIL\"");

				// JSON-ify the response
				try {
					data = jQuery.parseJSON(data);
				} catch(e) {
					console.log(data);
					requestFailed = true;
				}

				// check whether this is the current request (in the case of overlapping/lagging ajax calls)
				//	and only continue if so.
				if (updateOnInterval && activeRequest != reqObj)
				{
					return;
				}

				// if the request failed, do not continue, but reset the timer so that any repeating requests will continue
				if (requestFailed)
				{
					// stop any previous timer (from other accordion pane, for example) and schedule the next call of this function 
					if (updateOnInterval) 
					{
						clearTimeout(requestTimer);				
						requestTimer = setTimeout(function () {pmAjax.sendRequest(reqObj); }, reloadReportInterval);
					}

					return;
				}

				// add these registers to running response JSON object
				if (reqObj.type == "POST")
				{
					
					if (objData.result == null) objData.result = data.result;
					else objData.result = objData.result.concat(data.result);

					// if there are more registers to send, break them off and send them
					// -- do not continue running code from here
					if (endRegisterIndex <= lastRegisterIndex && startRegisterIndex <= lastRegisterIndex)
					{
						sendBatchRequest();
						return;
					}

					// else we're done processing all the registers, so continue this code to call the success callback
				}
				


				if(reqObj.successCallback) {
					
					if (objData.result != null) 
					{
						data = objData;

						// filter out any elements like {"errorCode: 1, "errorMessage": Parse Error"}
						//	- these are a special case of the API returning correct results but appending one 
						//		or more error messages like this, that do not refer to any particular register.
						data.result = jQuery.grep(data.result, function (element, index)
						{
							if (element.errorCode && element.errorCode == 1) return false;
							else return true;
						});

					}

					reqObj.successCallback(data, reqObj);

					// stop any previous timer (from other accordion pane, for example) and schedule the next call of this function 
					if (updateOnInterval) 
					{
						clearTimeout(requestTimer);				
						requestTimer = setTimeout(function () {pmAjax.sendRequest(reqObj); }, reloadReportInterval);
					}
				}
			});

			request.fail(function(jqXHR, textStatus, errorThrown) {

				if(reqObj.failCallback) {

					// check whether this is the current request (in the case of overlapping/lagging ajax calls)
					//	and only continue if so.
					if (updateOnInterval && activeRequest != reqObj)
					{
						return;
					}

					reqObj.failCallback(textStatus, errorThrown);	

					// stop any previous timer (from other accordion pane, for example) and schedule the next call of this function 
					if (updateOnInterval) 
					{
						clearTimeout(requestTimer);				
						requestTimer = setTimeout(function () {pmAjax.sendRequest(reqObj); }, reloadReportInterval);
					}
				}
			});
		}


		
		var updateOnInterval = reqObj.updateOnInterval;

		// default functionality is NOT to repeat this call on an interval
		if (updateOnInterval == 'undefined' || updateOnInterval == null)
		{
			updateOnInterval = false;
		}
		
		// if the update flag is a non-boolean representation of true/false (such as "true" string), convert to a boolean
		updateOnInterval = eval(updateOnInterval);

		// if we're repeating this call, set the request parameters object as the current request
		if (updateOnInterval) activeRequest = reqObj;

		if(development == "full") {
			var data = dummyData(reqObj);
			if(data!=null) {

				reqObj.successCallback(data, reqObj);

				// stop any previous timer (from other accordion pane, for example) and schedule the next call of this function 
				if (updateOnInterval) 
				{
					clearTimeout(requestTimer);				
					requestTimer = setTimeout(function () {pmAjax.sendRequest(reqObj); }, reloadReportInterval);
				}

			} else {

				reqObj.failCallback("textStatus", "errorThrown"); // TODO: setup fake error return

				// stop any previous timer (from other accordion pane, for example) and schedule the next call of this function 
				if (updateOnInterval) 
				{
					clearTimeout(requestTimer);				
					requestTimer = setTimeout(function () {pmAjax.sendRequest(reqObj); }, reloadReportInterval);
				}
			}
			return;
		}

		// send a batch of registers for processing
		sendBatchRequest();
	}
}