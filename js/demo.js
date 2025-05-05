$(document).ready(function () {// --- Examples of how to use loadSelectOptions after initialization ---
    // --- Example of how to use loadSelectOptions after initialization ---


    // Load static data for countrySelect
    const countries = [
        { value: 'usa', text: 'United States' },
        { value: 'canada', text: 'Canada' },
        { value: 'mexico', text: 'Mexico' },
        { value: 'uk', text: 'United Kingdom' },
        { value: 'germany', text: 'Germany' },
        { value: 'france', text: 'France' },
        { value: 'japan', text: 'Japan' },
        { value: 'australia', text: 'Australia' },
        { value: 'brazil', text: 'Brazil' },
        { value: 'india', text: 'India' },
        { value: 'china', text: 'China' },
        { value: 'russia', text: 'Russia' },
    ];
    $('#countrySelect').customMultiSelect('loadSelectOptions', countries);


    // Load static data for colorSelect
    const colors = [
        { value: 'red', text: 'Red' },
        { value: 'blue', text: 'Blue' },
        { value: 'green', text: 'Green' },
        { value: 'yellow', text: 'Yellow' },
        { value: 'purple', text: 'Purple' },
        { value: 'orange', text: 'Orange' },
        { value: 'black', text: 'Black' },
        { value: 'white', text: 'White' },
    ];
    $('#colorSelect').customMultiSelect('loadSelectOptions', colors);


    // The third component ('fruitSelect') already has options in HTML.
    // It will now behave as a multi-select.
    // You can still load options dynamically if needed, e.g., overwriting them.
    // const fruitData = [{ value: 'grape', text: 'Grape' }];
    // $('#fruitSelect').customMultiSelect('loadSelectOptions', fruitData);

    // Load static data for citySelect (NEW Single Select)
    const cities = [
        { value: 'london', text: 'London' },
        { value: 'paris', text: 'Paris' },
        { value: 'newyork', text: 'New York' },
        { value: 'tokyo', text: 'Tokyo' },
        { value: 'delhi', text: 'Delhi' },
        { value: 'sydney', text: 'Sydney' },
        { value: 'beijing', text: 'Beijing' },
    ];
    $('#citySelect').customMultiSelect('loadSelectOptions', cities);


    // --- Example of loading options after a simulated API call ---
    fetchOptionsFromAPI('countrySelect')
        .then(apiDataCountries => {
            $('#countrySelect').customMultiSelect('loadSelectOptions', apiDataCountries);
        })
        .catch(error => {
            console.error("Error loading country options from simulated API:", error);
        });


    // Example for the color select using simulated API
    fetchOptionsFromAPI('colorSelect')
        .then(apiDataColors => {
            $('#colorSelect').customMultiSelect('loadSelectOptions', apiDataColors);
        })
        .catch(error => {
            console.error("Error loading color options from simulated API:", error);
        });

    // Example for the city select using simulated API (NEW Single Select)
    fetchOptionsFromAPI('citySelect')
        .then(apiDataCities => {
            $('#citySelect').customMultiSelect('loadSelectOptions', apiDataCities);
        })
        .catch(error => {
            console.error("Error loading city options from simulated API:", error);
        });


    // --- Event listener for the Get Selected Values button ---
    // --- Event listener for the Get Selected Values button ---
    $('#getSelectedBtn').on('click', function() {
        console.log("Get Selected Values button clicked.");
        // Use the new val() getter method
        const selectedCountries = $('#countrySelect').val();
        const selectedColors = $('#colorSelect').val();
        const selectedFruits = $('#fruitSelect').val();


        let outputHtml = '<h2>Selected Values (using .val()):</h2>';

        outputHtml += `<h3>Countries:</h3><p>Values: ${selectedCountries ? selectedCountries.join(', ') : 'None'}</p>`;
        outputHtml += `<h3>Colors:</h3><p>Values: ${selectedColors ? selectedColors.join(', ') : 'None'}</p>`;
        outputHtml += `<h3>Fruits:</h3><p>Values: ${selectedFruits ? selectedFruits.join(', ') : 'None'}</p>`;


        $('#selectedValuesOutput').html(outputHtml);
    });


    // --- Event listeners for Enable/Disable buttons ---
    $('#disableCountryBtn').on('click', function () {
        const countrySelectInstance = $('#countrySelect').data('customMultiSelect');
        if (countrySelectInstance) {
            countrySelectInstance.disable();
        }
    });

    $('#enableCountryBtn').on('click', function () {
        const countrySelectInstance = $('#countrySelect').data('customMultiSelect');
        if (countrySelectInstance) {
            countrySelectInstance.enable();
        }
    });

    // --- Event listeners for Set Selected buttons ---
    $('#setCountryValuesBtn').on('click', function() {
        // Use the new val() setter method
        $('#countrySelect').val(['usa', 'canada']);
    });


    $('#clearCountryBtn').on('click', function() {
        // Use the new val() setter method with an empty array
        $('#countrySelect').val([]);
    });

    $('#setCityValueBtn').on('click', function () {
        $('#citySelect').val(['delhi']); // Set the value directly for the single select
    });

    $('#clearCityBtn').on('click', function () {
        // Use the new val() setter method with an empty array
        $('#citySelect').val([]); // Clear the value directly for the single select
    });

    $('#showCountrySelectBtn').on('click', function () {
        const countrySelectInstance = $('#countrySelect').data('customMultiSelect');
        const cityInstance = $('#citySelect').data('customMultiSelect');
        if (countrySelectInstance && cityInstance) {
            countrySelectInstance.showComponent();
            cityInstance.showComponent();
        }
    });

    $('#hideCountrySelectBtn').on('click', function () {
        const countrySelectInstance = $('#countrySelect').data('customMultiSelect');
        const cityInstance = $('#citySelect').data('customMultiSelect');
        if (countrySelectInstance) {
            countrySelectInstance.hideComponent();
            cityInstance.hideComponent();
        }
    });


    // --- Example of binding the change event ---
    $('#countrySelect').on('change.customMultiSelect', function (event, selectedValues, selectedTexts) {
        console.log("Change event triggered on #countrySelect!");
        console.log("Selected Values:", selectedValues);
        console.log("Selected Texts:", selectedTexts);

        // Example of updating another component based on this change
        const $colorSelectContainer = $('#colorSelect');
        const colorSelectInstance = $colorSelectContainer.data('customMultiSelect');

        if (colorSelectInstance && colorSelectInstance.$selectedTextSpan && colorSelectInstance.$selectedTextSpan.length) {
            if (selectedTexts && Array.isArray(selectedTexts) && selectedTexts.length > 0) {
                colorSelectInstance.$selectedTextSpan.text(`Related to: ${selectedTexts.join(', ')}`);
                colorSelectInstance.$displayButton.removeClass('placeholder');
            } else {
                colorSelectInstance.$selectedTextSpan.text(colorSelectInstance.placeholderText);
                colorSelectInstance.$displayButton.addClass('placeholder');
            }
        } else {
            console.warn("Could not update color select display: Instance or selected text span missing.");
        }
    });

    // Example of binding the change event for the NEW Single Select
    $('#citySelect').on('change.customMultiSelect', function (event, selectedValues, selectedTexts) {
        console.log("Change event triggered on #citySelect!");
        console.log("Selected Value:", selectedValues[0] || 'None'); // Access the single value
        console.log("Selected Text:", selectedTexts[0] || 'None'); // Access the single text

        // You could do something here based on the selected city
    });

     // --- Event listener for Refresh button ---
     $('#refreshCountryBtn').on('click', function() {
        const countrySelectInstance = $('#countrySelect').data('customMultiSelect');
        if (countrySelectInstance) {
            countrySelectInstance.refresh();
        }
    });

   
}); // End of $(document).ready()

// --- Example of simulating an API call function ---
function fetchOptionsFromAPI(componentId) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (componentId === 'countrySelect') {
                resolve([
                    { value: 'usa', text: 'United States (API)' },
                    { value: 'canada', text: 'Canada (API)' },
                    { value: 'mexico', text: 'Mexico (API)' },
                    { value: 'uk', text: 'United Kingdom (API)' },
                    { value: 'germany', text: 'Germany (API)' },
                    { value: 'france', text: 'France (API)' },
                ]);
            } else if (componentId === 'colorSelect') {
                resolve([
                    { value: 'red', text: 'Red (API)' },
                    { value: 'blue', text: 'Blue (API)' },
                    { value: 'green', text: 'Green (API)' },
                ]);
            } else if (componentId === 'citySelect') { // Data for NEW Single Select
                resolve([
                    { value: 'london', text: 'London (API)' },
                    { value: 'paris', text: 'Paris (API)' },
                    { value: 'newyork', text: 'New York (API)' },
                    { value: 'tokyo', text: 'Tokyo (API)' },
                    { value: 'delhi', text: 'Delhi (API)' },
                    { value: 'sydney', text: 'Sydney (API)' },
                    { value: 'beijing', text: 'Beijing (API)' },
                ]);
            }
            else {
                console.error(`Simulated API: No data defined for componentId: ${componentId}`);
                reject(`No data for this component ID: ${componentId}`);
            }
        }, 500);
    });
}
