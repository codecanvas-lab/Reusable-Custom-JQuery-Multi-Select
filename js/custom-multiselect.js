// Use strict mode
"use strict";

/**
 * @class CustomMultiSelect
 * @classdesc A reusable, accessible custom multi-select dropdown component.
 * It mimics a single select dropdown visually but supports multi-selection.
 * Includes search, select all/deselect all, keyboard navigation, and WAI-ARIA attributes.
 * Now also supports single-select mode.
 */
class CustomMultiSelect {

    /**
     * Helper method to update aria-activedescendant and visual indicator.
     * This is used when focus is NOT directly on a list item (e.g., on search or select all).
     * @private
     * @param {jQuery|null} $optionToHighlight - The jQuery object of the option to highlight, or null to clear.
     */
    _updateActiveDescendant($optionToHighlight) {
        // Remove focused-option class from previously highlighted item
        if (this.$customOptionsList && this.$customOptionsList.length) {
            this.$customOptionsList.find('.focused-option').removeClass('focused-option');
        }

        if ($optionToHighlight && $optionToHighlight.length) {
            // Ensure the option has an ID for aria-activedescendant
            if (!$optionToHighlight.attr('id')) {
                $optionToHighlight.attr('id', `${this.containerId}_option_${$optionToHighlight.index()}`);
            }
            if (this.$customOptionsList && this.$customOptionsList.length) {
                this.$customOptionsList.attr('aria-activedescendant', $optionToHighlight.attr('id'));
                $optionToHighlight.addClass('focused-option'); // Add visual highlight
                // Optional: Scroll the item into view if needed
                // $optionToHighlight[0].scrollIntoView({ block: 'nearest' });
            }
        } else {
            if (this.$customOptionsList && this.$customOptionsList.length) {
                this.$customOptionsList.attr('aria-activedescendant', '');
            }
        }
    }

    /**
     * Updates the text displayed in the selected values display button.
     * Handles truncation based on maxDisplaySize option in multi-select mode.
     * In single-select mode, displays the text of the single selected item.
     * @public
     */
    updateDisplay() {
        if (!this.$selectedTextSpan || this.$selectedTextSpan.length === 0 || !this.$displayButton || this.$displayButton.length === 0) {
            console.warn(`[${this.containerId}] updateDisplay: Required elements missing.`);
            return;
        }

        const selectedTexts = this.getSelectedTexts();
        const selectedCount = selectedTexts.length;
        const maxDisplay = this.options.maxDisplaySize;

        let displayText = '';

        if (selectedCount === 0) {
            displayText = this.placeholderText;
            this.$displayButton.addClass('placeholder');
        } else {
            this.$displayButton.removeClass('placeholder');
            if (this.options.singleSelect) {
                // In single select, just show the one selected item's text
                displayText = selectedTexts[0] || this.placeholderText;
            } else if (maxDisplay > 0 && selectedCount > maxDisplay) {
                // Multi-select with truncation
                displayText = selectedTexts.slice(0, maxDisplay).join(', ') + ` (+${selectedCount - maxDisplay})`;
            } else {
                // Multi-select, show all selected items
                displayText = selectedTexts.join(', ');
            }
        }

        this.$selectedTextSpan.text(displayText);

        // Update aria-label for the display button for better accessibility
        if (selectedCount > 0) {
            this.$displayButton.attr('aria-label', `Selected option${selectedCount > 1 ? 's' : ''}: ${selectedTexts.join(', ')}`);
        } else {
            this.$displayButton.attr('aria-label', this.placeholderText || 'Select options');
        }
    }


    /**
     * Default options for the component.
     * @static
     * @returns {object} Default options.
     */
    static get DEFAULTS() {
        return {
            enableSearch: true, // Whether to show and enable the search input.
            maxDisplaySize: 0, // Maximum number of selected items to display before truncating (0 means no limit).
            singleSelect: false // Whether the component should behave as a single-select dropdown.
        };
    }

    /**
     * Initializes a new instance of the CustomMultiSelect component.
     * @param {jQuery} $container - The jQuery object representing the main container element.
     * @param {object} [options={}] - Configuration options to override defaults.
     */
    constructor($container, options = {}) {

        /** @member {jQuery} $container - The main container element. */
        this.$container = $container;

        /** @member {object} options - Merged configuration options. */
        this.options = $.extend({}, CustomMultiSelect.DEFAULTS, options, this.$container.data());

        // --- Element References ---
        /** @member {jQuery} $labelElement - The screen reader only label element. */
        this.$labelElement = this.$container.find('.sr-only').first();
        /** @member {jQuery} $displayButton - The button that displays selected values and opens the dropdown. */
        this.$displayButton = this.$container.find('.selected-values-display').first();
        /** @member {jQuery} $selectedTextSpan - The span inside the display button holding the selected text. */
        this.$selectedTextSpan = this.$displayButton.find('.selected-text').first();
        /** @member {jQuery} $dropdownContainer - The container holding the search, select all, and options list. */
        this.$dropdownContainer = this.$container.find('.select-dropdown-container').first();
        /** @member {jQuery} $selectAllDiv - The "Select All" button/div. */
        this.$selectAllDiv = this.$container.find('.select-all-options').first();
        /** @member {jQuery} $customOptionsList - The UL element containing the custom options (LI). */
        this.$customOptionsList = this.$container.find('.custom-options-list').first();
        /** @member {jQuery} $searchInput - The search input field. */
        this.$searchInput = this.$dropdownContainer.find('.search-input').first();
        /** @member {jQuery} $liveRegion - The ARIA live region for announcements. */
        this.$liveRegion = this.$container.find('.sr-only[aria-live]').first();

        /** @member {string} placeholderText - The initial placeholder text from the display button. */
        this.placeholderText = this.$selectedTextSpan && this.$selectedTextSpan.length ? this.$selectedTextSpan.text().trim() : 'Select options...';

        /** @member {boolean} isDisabled - Tracks the disabled state of the component. */
        this.isDisabled = false;

        /** @member {Array<string>} _lastSelectedValues - Stores the last selected values for change event detection. */
        this._lastSelectedValues = []; // Initialize before loading options

        // --- Explicitly bind methods to the instance to ensure 'this' context ---
        // Binding methods here guarantees 'this' refers to the instance
        this.updateDisplay = this.updateDisplay.bind(this);
        this._updateActiveDescendant = this._updateActiveDescendant.bind(this);
        this.showSelect = this.showSelect.bind(this);
        this.hideSelect = this.hideSelect.bind(this);
        this.toggleSelectAll = this.toggleSelectAll.bind(this);
        this.enable = this.enable.bind(this);
        this.disable = this.disable.bind(this);
        this.getSelectedValues = this.getSelectedValues.bind(this);
        this.getSelectedTexts = this.getSelectedTexts.bind(this);
        this.setSelectedValues = this.setSelectedValues.bind(this);
        this.setSelectedTexts = this.setSelectedTexts.bind(this);
        this.loadSelectOptions = this.loadSelectOptions.bind(this);
        this._handleDisplayButtonClick = this._handleDisplayButtonClick.bind(this);
        this._handleDisplayButtonKeydown = this._handleDisplayButtonKeydown.bind(this);
        this._handleSearchInput = this._handleSearchInput.bind(this);
        this._handleSearchInputKeydown = this._handleSearchInputKeydown.bind(this);
        this._handleSelectAllKeydown = this._handleSelectAllKeydown.bind(this);
        this._handleOptionClick = this._handleOptionClick.bind(this);
        this._handleOptionKeydown = this._handleOptionKeydown.bind(this);
        this._handleOptionMouseOver = this._handleOptionMouseOver.bind(this);
        this._handleOptionMouseOut = this._handleOptionMouseOut.bind(this);
        this._handleDocumentClick = this._handleDocumentClick.bind(this);
        this._handleDocumentFocusIn = this._handleDocumentFocusIn.bind(this);
        this._moveFocus = this._moveFocus.bind(this);
        this._handleNavigationFromLastOption = this._handleNavigationFromLastOption.bind(this);
        this._handleNavigationFromFirstOption = this._handleNavigationFromFirstOption.bind(this);
        this._toggleOptionSelection = this._toggleOptionSelection.bind(this);
        this._areArraysEqual = this._areArraysEqual.bind(this);
        this._triggerChangeEvent = this._triggerChangeEvent.bind(this);
        this._unbindEvents = this._unbindEvents.bind(this);
        this.showComponent = this.showComponent.bind(this); // Bind new method
        this.hideComponent = this.hideComponent.bind(this); // Bind new method


        // --- ID Handling ---
        this._ensureUniqueIds();

        // --- Accessibility Setup ---
        this._setupAccessibility();

        // --- Bind Event Listeners ---
        this._bindEvents();

        // --- Initialization ---
        this._initializeComponent();

    }

    /**
     * Ensures the container and key internal elements have unique IDs, generating them if necessary.
     * Sets up ARIA attributes based on these IDs.
     * @private
     */
    _ensureUniqueIds() {
        // Ensure the container element has an ID
        if (!this.$container.attr('id')) {
            const generatedId = `customMultiSelect_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            this.$container.attr('id', generatedId);
        }
        /** @member {string} containerId - The unique ID of the container element. */
        this.containerId = this.$container.attr('id');

        // Generate unique IDs for internal elements based on container ID if they don't exist
        const listId = `${this.containerId}_list`;
        const labelId = `${this.containerId}_label`;
        const displayId = `${this.containerId}_display`; // Assuming display button has an ID in HTML
        const searchInputId = `${this.containerId}_search`; // Assuming search input has an ID in HTML

        if (this.$customOptionsList && !this.$customOptionsList.attr('id')) this.$customOptionsList.attr('id', listId);
        if (this.$labelElement && !this.$labelElement.attr('id')) this.$labelElement.attr('id', labelId);
        // displayId and searchInputId are expected in HTML, but add fallback if needed
        if (this.$displayButton && !this.$displayButton.attr('id')) this.$displayButton.attr('id', displayId);
        if (this.$searchInput && !this.$searchInput.attr('id')) this.$searchInput.attr('id', searchInputId);
    }

    /**
     * Sets up initial WAI-ARIA attributes for accessibility.
     * Adjusts aria-multiselectable based on singleSelect option.
     * @private
     */
    _setupAccessibility() {
        // Associate the SR-only label with the LISTBOX (UL) using aria-labelledby
        if (this.$labelElement && this.$labelElement.length && this.$customOptionsList && this.$customOptionsList.length) {
            this.$labelElement.text(this.placeholderText || 'Multi-select options'); // Set accessible name for the label
            this.$customOptionsList.attr('aria-labelledby', this.$labelElement.attr('id'));
        } else {
            console.warn(`[${this.containerId}] Cannot set aria-labelledby on listbox: SR-only label or listbox element missing.`);
        }

        // The UL acts as the listbox
        if (this.$customOptionsList && this.$customOptionsList.length) {
            this.$customOptionsList.attr('role', 'listbox');
            // Set aria-multiselectable based on the singleSelect option
            this.$customOptionsList.attr('aria-multiselectable', this.options.singleSelect ? 'false' : 'true');
            this.$customOptionsList.attr('aria-activedescendant', ''); // Initially empty
        }


        // The display button acts as the button that opens the listbox
        if (this.$displayButton && this.$displayButton.length && this.$customOptionsList && this.$customOptionsList.length) {
            this.$displayButton.attr('aria-haspopup', 'listbox');
            this.$displayButton.attr('aria-expanded', 'false'); // Initially collapsed
            this.$displayButton.attr('aria-controls', this.$customOptionsList.attr('id')); // Link to the UL
            // Link visible label AND display button ID for composite accessible name
            if (this.$labelElement && this.$labelElement.length && this.$displayButton.attr('id')) {
                this.$displayButton.attr('aria-labelledby', `${this.$labelElement.attr('id')} ${this.$displayButton.attr('id')}`);
            } else if (this.$displayButton.attr('id')) {
                // Fallback if SR label is missing, use only display button ID
                this.$displayButton.attr('aria-labelledby', this.$displayButton.attr('id'));
            } else {
                // Fallback if no IDs are available, use aria-label
                this.$displayButton.attr('aria-label', this.placeholderText || 'Select options');
            }
        } else {
            console.warn(`[${this.containerId}] Cannot set ARIA attributes on display button: Button, listbox, or SR label missing.`);
        }


        // Select All button accessibility (only relevant for multi-select)
        if (this.$selectAllDiv && this.$selectAllDiv.length) {
            this.$selectAllDiv.attr('tabindex', this.options.singleSelect ? '-1' : '0'); // Disable tab in single select
            this.$selectAllDiv.attr('aria-disabled', this.options.singleSelect ? 'true' : 'false'); // Disable in single select
            this.$selectAllDiv.attr('role', 'button');
            this.$selectAllDiv.attr('aria-label', 'Select or Deselect All Options');
        } else {
            console.warn(`[${this.containerId}] Select All element missing.`);
        }


        // Search Input Accessibility
        if (this.$searchInput && this.$searchInput.length && this.$customOptionsList && this.$customOptionsList.length) {
            this.$searchInput.attr('role', 'searchbox');
            this.$searchInput.attr('aria-label', 'Search options');
            this.$searchInput.attr('autocomplete', 'off');
            this.$searchInput.attr('aria-controls', this.$customOptionsList.attr('id')); // Link to the listbox
        } else {
            console.warn(`[${this.containerId}] Search input or listbox element missing for search accessibility.`);
        }
    }

    /**
     * Performs initial setup like showing/hiding search and select all, and updating the display.
     * @private
     */
    _initializeComponent() {
        // Conditionally show/hide search input
        if (this.$searchInput && this.$searchInput.length) {
            if (this.options.enableSearch) {
                this.$searchInput.show();
            } else {
                this.$searchInput.hide();
            }
        } else {
            console.warn(`[${this.containerId}] Search input element missing.`);
        }


        // Conditionally show/hide Select All button based on singleSelect option
        if (this.$selectAllDiv && this.$selectAllDiv.length) {
            if (this.options.singleSelect) {
                this.$selectAllDiv.hide();
            } else {
                this.$selectAllDiv.show();
            }
        } else {
            console.warn(`[${this.containerId}] Select All element missing.`);
        }


        // Update the display based on initial state (if options are in HTML)
        this.updateDisplay();
        // Initialize last selected values after initial display update
        this._lastSelectedValues = this.getSelectedValues();
    }


    /**
     * Binds all necessary event listeners to the component elements.
     * Uses event delegation where appropriate.
     * @private
     */
    _bindEvents() {
        // Ensure events are unbound before binding to prevent duplicates
        this._unbindEvents();

        // Use a single event namespace for easier unbinding
        const eventNamespace = `.customMultiSelect_${this.containerId}`;

        // --- Display Button Events ---
        if (this.$displayButton && this.$displayButton.length) {
            this.$displayButton.on(`click${eventNamespace}`, this._handleDisplayButtonClick);
            this.$displayButton.on(`keydown${eventNamespace}`, this._handleDisplayButtonKeydown);
        } else {
            console.warn(`[${this.containerId}] Display button element missing, cannot bind events.`);
        }


        // --- Search Input Events ---
        if (this.options.enableSearch && this.$searchInput && this.$searchInput.length) {
            this.$searchInput.on(`input${eventNamespace}`, this._handleSearchInput);
            this.$searchInput.on(`keydown${eventNamespace}`, this._handleSearchInputKeydown);
            // Prevent native change event from bubbling up from search input
            this.$searchInput.on(`change${eventNamespace}`, (event) => event.stopPropagation());
        } else if (this.$searchInput && this.$searchInput.length) {
            // If search is disabled, ensure no events are bound
            this.$searchInput.off(eventNamespace);
        } else {
            console.warn(`[${this.containerId}] Search input element missing, cannot bind events.`);
        }


        // --- Select All Button Events (only bind if not single select) ---
        if (!this.options.singleSelect && this.$selectAllDiv && this.$selectAllDiv.length) {
            this.$selectAllDiv.on(`click${eventNamespace}`, this.toggleSelectAll); // Call public method
            this.$selectAllDiv.on(`keydown${eventNamespace}`, this._handleSelectAllKeydown);
        } else if (this.$selectAllDiv && this.$selectAllDiv.length) {
            // Ensure events are off if switching from multi to single or if component is disabled
            this.$selectAllDiv.off(eventNamespace);
        } else {
            console.warn(`[${this.containerId}] Select All element missing, cannot bind events.`);
        }


        // --- Custom Options List Events (using delegation) ---
        if (this.$customOptionsList && this.$customOptionsList.length) {
            this.$customOptionsList
                .on(`click${eventNamespace}`, 'li', this._handleOptionClick)
                .on(`keydown${eventNamespace}`, 'li', this._handleOptionKeydown)
                .on(`mouseover${eventNamespace}`, 'li', this._handleOptionMouseOver)
                .on(`mouseout${eventNamespace}`, 'li', this._handleOptionMouseOut);
        } else {
            console.warn(`[${this.containerId}] Custom options list element missing, cannot bind events.`);
        }


        // --- Global Document Events (for hiding dropdown) ---
        $(document).on(`click${eventNamespace}`, this._handleDocumentClick);
        $(document).on(`focusin${eventNamespace}`, this._handleDocumentFocusIn);

    }

    /**
     * Unbinds all event listeners associated with this component instance.
     * @private
     */
    _unbindEvents() {
        const eventNamespace = `.customMultiSelect_${this.containerId}`;

        if (this.$displayButton && this.$displayButton.length) this.$displayButton.off(eventNamespace);
        if (this.$searchInput && this.$searchInput.length) this.$searchInput.off(eventNamespace);
        if (this.$selectAllDiv && this.$selectAllDiv.length) this.$selectAllDiv.off(eventNamespace);
        if (this.$customOptionsList && this.$customOptionsList.length) this.$customOptionsList.off(eventNamespace, 'li');
        $(document).off(eventNamespace);

    }


    // --- Event Handlers ---

    /**
     * Handles click event on the display button. Toggles dropdown visibility.
     * @private
     */
    _handleDisplayButtonClick() {
        if (this.isDisabled) return;
        if (this.$dropdownContainer && this.$dropdownContainer.length) {
            if (this.$dropdownContainer.is(':visible')) {
                this.hideSelect();
            } else {
                this.showSelect();
            }
        } else {
            console.warn(`[${this.containerId}] Display button click handler: Dropdown container missing.`);
        }
    }

    /**
     * Handles keydown event on the display button. Opens dropdown on Enter, Space, ArrowDown.
     * @private
     * @param {KeyboardEvent} event - The keydown event object.
     */
    _handleDisplayButtonKeydown(event) {
        if (this.isDisabled) return;
        if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
            event.preventDefault();
            this.showSelect();
        } else if (event.key === 'ArrowUp') {
            // Allow ArrowUp to open the select if closed
            if (this.$dropdownContainer && this.$dropdownContainer.length && !this.$dropdownContainer.is(':visible')) {
                event.preventDefault();
                this.showSelect();
            }
        }
    }

    /**
     * Handles input event on the search input. Filters the options list.
     * @private
     */
    _handleSearchInput() {
        if (this.isDisabled) return;
        if (!this.$searchInput || this.$searchInput.length === 0 || !this.$customOptionsList || this.$customOptionsList.length === 0) {
            console.warn(`[${this.containerId}] Search input handler: Required elements missing.`);
            return;
        }

        const searchTerm = this.$searchInput.val().toLowerCase();

        const $optionItems = this.$customOptionsList.find('li');
        let visibleCount = 0;

        // Optimized filtering loop
        $optionItems.each(function () {
            const $item = $(this);
            // Cache the text content to avoid re-reading the DOM in each iteration
            const itemText = $item.data('text') || $item.text().toLowerCase();
            if (!$item.data('text')) {
                $item.data('text', itemText); // Store cached text
            }


            if (itemText.includes(searchTerm)) {
                $item.show();
                visibleCount++;
            } else {
                $item.hide();
            }
        });

        // Update live region with search results count
        if (this.$liveRegion && this.$liveRegion.length) {
            if (searchTerm === '') {
                this.$liveRegion.text('');
            } else if (visibleCount === 0) {
                this.$liveRegion.text('No results found.');
            } else {
                this.$liveRegion.text(`${visibleCount} results found.`);
            }
        }

        // After filtering, if search has focus, highlight the first visible enabled option
        if (this.$searchInput.is(':focus')) {
            const $firstVisibleEnabledOption = this.$customOptionsList.find('li:visible:not(.disabled-option)').first();
            this._updateActiveDescendant($firstVisibleEnabledOption);
        }
    }

    /**
     * Handles keydown event on the search input. Manages keyboard navigation from search.
     * @private
     * @param {KeyboardEvent} event - The keydown event object.
     */
    _handleSearchInputKeydown(event) {
        if (this.isDisabled) return;
        if (!this.$customOptionsList || this.$customOptionsList.length === 0 || !this.$searchInput || this.$searchInput.length === 0) {
            console.warn(`[${this.containerId}] Search input keydown handler: Required elements missing.`);
            return;
        }

        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                // In single select, ArrowDown from search goes directly to the first option.
                // In multi-select, it goes to Select All or the first option.
                if (!this.options.singleSelect && this.$selectAllDiv && this.$selectAllDiv.length && this.$selectAllDiv.is(':visible') && this.$selectAllDiv.attr('aria-disabled') !== 'true') {
                    this.$selectAllDiv.focus();
                    this._updateActiveDescendant(null);
                } else {
                    const $firstVisibleEnabledOption = this.$customOptionsList.find('li:visible:not(.disabled-option)').first();
                    if ($firstVisibleEnabledOption.length) {
                        this._moveFocus(this.$searchInput, $firstVisibleEnabledOption); // Use moveFocus helper
                        this._updateActiveDescendant(null); // Clear active descendant as focus is now on the item
                    }
                }
                break;
            case 'Escape':
                event.preventDefault();
                this.hideSelect();
                if (this.$displayButton && this.$displayButton.length) this.$displayButton.focus();
                break;
        }
    }

    /**
     * Handles keydown event on the Select All button. Manages keyboard navigation from Select All.
     * Only active in multi-select mode.
     * @private
     * @param {KeyboardEvent} event - The keydown event object.
     */
    _handleSelectAllKeydown(event) {
        if (this.isDisabled || this.options.singleSelect) return; // Only active in multi-select
        if (!this.$selectAllDiv || this.$selectAllDiv.length === 0 || !this.$customOptionsList || this.$customOptionsList.length === 0) {
            console.warn(`[${this.containerId}] Select All keydown handler: Required elements missing.`);
            return;
        }

        switch (event.key) {
            case 'Enter':
            case ' ':
                event.preventDefault();
                this.toggleSelectAll();
                break;
            case 'ArrowDown':
                event.preventDefault();
                // Focus the first *visible* and *enabled* option
                const $firstVisibleEnabledOption = this.$customOptionsList.find('li:visible:not(.disabled-option)').first();
                if ($firstVisibleEnabledOption.length) {
                    this._moveFocus(this.$selectAllDiv, $firstVisibleEnabledOption); // Use moveFocus helper
                    this._updateActiveDescendant(null); // Clear active descendant as focus is now on the item
                }
                break;
            case 'ArrowUp':
                event.preventDefault();
                // Move focus to the search input if enabled and visible
                if (this.options.enableSearch && this.$searchInput && this.$searchInput.length && this.$searchInput.is(':visible') && !this.$searchInput.prop('disabled')) {
                    this._moveFocus(this.$selectAllDiv, this.$searchInput); // Use moveFocus helper
                    this._updateActiveDescendant(null); // Clear active descendant as focus is now on the item
                }
                break;
            case 'Escape':
                event.preventDefault();
                this.hideSelect();
                if (this.$displayButton && this.$displayButton.length) this.$displayButton.focus();
                break;
        }
    }

    /**
     * Handles click event on a list item (option). Toggles selection in multi-select,
     * selects and closes in single-select.
     * @private
     * @param {MouseEvent} event - The click event object.
     */
    _handleOptionClick(event) {
        if (this.isDisabled) return;
        const $clickedItem = $(event.currentTarget);

        if ($clickedItem.hasClass('disabled-option')) {
            return;
        }

        if (this.options.singleSelect) {
            // Single select mode: Deselect all others, select this one, and close
            this.$customOptionsList.find('li.selected-option').removeClass('selected-option').attr('aria-selected', 'false');
            $clickedItem.addClass('selected-option').attr('aria-selected', 'true');
            this.updateDisplay();
            this._triggerChangeEvent();
            this.hideSelect(); // Close the dropdown after selection in single select
            if (this.$displayButton && this.$displayButton.length) this.$displayButton.focus(); // Return focus to display button
        } else {
            // Multi-select mode: Toggle selection
            this._toggleOptionSelection($clickedItem);
            this.updateDisplay();
            this._triggerChangeEvent();
            // Keep focus on the clicked item in multi-select
            $clickedItem.focus();
            this._updateActiveDescendant(null); // Clear active descendant as focus is on the item
        }
    }

    /**
     * Handles keydown event on a list item (option). Manages keyboard navigation and selection.
     * Behavior differs slightly based on singleSelect mode.
     * @private
     * @param {KeyboardEvent} event - The keydown event object.
     */
    _handleOptionKeydown(event) {
        if (this.isDisabled) return;
        const $currentItem = $(event.currentTarget);
        if ($currentItem.hasClass('disabled-option')) {
            return;
        }

        if (!this.$customOptionsList || this.$customOptionsList.length === 0) {
            console.warn(`[${this.containerId}] List item keydown handler: Options list missing.`);
            return;
        }

        const $optionItems = this.$customOptionsList.find('li:visible:not(.disabled-option)'); // Only consider *visible* and *enabled* options

        // ** Add check for $optionItems validity before proceeding **
        if (!$optionItems || $optionItems.length === 0) {
            return; // Exit if no options are found after filtering
        }


        const currentIndex = $optionItems.index($currentItem);


        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                // Add check to ensure there is a next index
                if (currentIndex < $optionItems.length - 1) {
                    const $nextItem = $optionItems.eq(currentIndex + 1);
                    // ** Add check for $nextItem validity before accessing length or focusing **
                    if ($nextItem && $nextItem.length) { // This is the crucial check
                        this._moveFocus($currentItem, $nextItem); // Use moveFocus helper
                        this._updateActiveDescendant(null); // Clear active descendant as focus is now on the item
                    }
                } else {
                    // If at the last item, move focus to the search input if enabled, or Select All if available, or loop to the first item
                    this._handleNavigationFromLastOption($currentItem); // Use helper
                }
                break;
            case 'ArrowUp':
                event.preventDefault();
                // Add check to ensure there is a previous index or an element above
                if (currentIndex > 0) {
                    // Move focus to the previous visible enabled option
                    const $prevItem = $optionItems.eq(currentIndex - 1);
                    // ** Add check for $prevItem validity before accessing length or focusing **
                    if ($prevItem && $prevItem.length) { // This is the crucial check
                        this._moveFocus($currentItem, $prevItem); // Use helper
                        this._updateActiveDescendant(null); // Clear active descendant as focus is on the item
                    }
                } else {
                    // If at the first item, move focus to Select All or search input
                    this._handleNavigationFromFirstOption($currentItem); // Use helper
                }
                break;
            case ' ':
            case 'Enter':
                event.preventDefault();
                // Trigger click to toggle selection (multi) or select and close (single)
                $currentItem.trigger('click');
                break;
            case 'Escape':
                event.preventDefault();
                this.hideSelect(); // hideSelect has internal checks now
                // Add check before focusing
                if (this.$displayButton && this.$displayButton.length) { // Added length check
                    this.$displayButton.focus();
                }
                break;
        }
    }

    /**
     * Handles mouseover event on a list item. Updates aria-activedescendant for screen readers.
     * @private
     * @param {MouseEvent} event - The mouseover event object.
     */
    _handleOptionMouseOver(event) {
        if (this.isDisabled) return;
        const $hoveredItem = $(event.currentTarget);
        if (!$hoveredItem.hasClass('disabled-option')) {
            // If focus is not currently on a list item, update aria-activedescendant on mouseover
            if (this.$customOptionsList && this.$customOptionsList.length && !this.$customOptionsList.find(':focus').length) { // Added length check
                this._updateActiveDescendant($hoveredItem);
            }
        }
    }

    /**
     * Handles mouseout event on a list item. Clears aria-activedescendant if focus leaves the list.
     * @private
     * @param {MouseEvent} event - The mouseout event object.
     */
    _handleOptionMouseOut(event) {
        if (this.isDisabled) return;
        // Only clear if the focus is not within the listbox, search, or select all
        if (this.$customOptionsList && this.$customOptionsList.length &&
            !this.$customOptionsList.find(':focus').length &&
            !(this.$searchInput && this.$searchInput.length && this.$searchInput.is(':focus')) &&
            !(this.$selectAllDiv && this.$selectAllDiv.length && this.$selectAllDiv.is(':focus'))) { // Added checks for element existence and length
            this._updateActiveDescendant(null);
        }
    }


    /**
     * Handles click events on the document to close the dropdown if the click is outside.
     * @private
     * @param {MouseEvent} event - The click event object.
     */
    _handleDocumentClick(event) {
        if (this.isDisabled) return;
        // Check if the click occurred outside this specific container AND the dropdown is currently visible
        if (this.$container && this.$container.length && this.$dropdownContainer && this.$dropdownContainer.length &&
            !$.contains(this.$container[0], event.target) && this.$dropdownContainer.is(':visible')) {
            this.hideSelect();
        }
    }

    /**
     * Handles focusin events on the document to close the dropdown if focus moves outside.
     * Uses a small delay to ensure focus has settled.
     * @private
     * @param {FocusEvent} event - The focusin event object.
     */
    _handleDocumentFocusIn(event) {
        if (this.isDisabled) return;
        const containerElement = this.$container && this.$container.length ? this.$container[0] : null;

        if (containerElement && $.contains(document.documentElement, containerElement)) {
            if (!$.contains(containerElement, event.target)) {
                // Add a small delay to check focus state after blur/focus events complete
                setTimeout(() => {
                    // Re-get the instance and element inside the timeout for robustness
                    const $containerInTimeout = $(`#${this.containerId}`); // Use this.containerId
                    const instanceInTimeout = $containerInTimeout.length ? $containerInTimeout.data('customMultiSelect') : null; // Get instance by ID
                    const elementInTimeout = $containerInTimeout.length ? $containerInTimeout[0] : null; // Get element by ID

                    // Check if the instance, element, and dropdown are still valid and visible,
                    // and if focus is still outside the container and the component is not disabled.
                    if (instanceInTimeout && elementInTimeout && $.contains(document.documentElement, elementInTimeout) && instanceInTimeout.$dropdownContainer && instanceInTimeout.$dropdownContainer.length && instanceInTimeout.$dropdownContainer.is(':visible') && !$.contains(instanceInTimeout.$container[0], document.activeElement) && !instanceInTimeout.isDisabled) {
                        instanceInTimeout.hideSelect(); // hideSelect has internal checks now
                    }
                }, 1);
            }
        } else {
            // Container element is no longer in the DOM, no action needed.
        }
    }


    // --- Helper Methods for Keyboard Navigation ---

    /**
     * Moves focus from one element to another and updates tabindex.
     * @private
     * @param {jQuery} $fromItem - The jQuery object of the element losing focus.
     * @param {jQuery} $toItem - The jQuery object of the element gaining focus.
     */
    _moveFocus($fromItem, $toItem) {
        // Ensure the element we are moving focus *from* is focusable via script
        if ($fromItem && $fromItem.length && ($fromItem.is('li') || $fromItem.is('input') || $fromItem.is('[role="button"]'))) {
            $fromItem.attr('tabindex', '-1');
        }
        if ($toItem && $toItem.length) {
            $toItem.attr('tabindex', '0');
            $toItem.focus();
        }
    }

    /**
     * Handles keyboard navigation when the last option in the list has focus (ArrowDown).
     * Moves focus to the search input (if enabled) or Select All button (multi-select only).
     * @private
     * @param {jQuery} $currentItem - The jQuery object of the currently focused list item.
     */
    _handleNavigationFromLastOption($currentItem) {
        // Try to move focus to the search input if enabled and visible
        if (this.options.enableSearch && this.$searchInput && this.$searchInput.length && this.$searchInput.is(':visible') && !this.$searchInput.prop('disabled')) {
            this._moveFocus($currentItem, this.$searchInput); // Use moveFocus helper
            this._updateActiveDescendant(null); // Clear active descendant as focus is now on the search input
        }
        // If search is not available/enabled, try to move focus to Select All (multi-select only)
        else if (!this.options.singleSelect && this.$selectAllDiv && this.$selectAllDiv.length && this.$selectAllDiv.is(':visible') && this.$selectAllDiv.attr('aria-disabled') !== 'true') {
            this._moveFocus($currentItem, this.$selectAllDiv); // Use moveFocus helper
            this._updateActiveDescendant(null); // Clear active descendant as focus is now on Select All
        }
        // If no element above, keep focus on the last item (or loop back if desired, but keeping focus is simpler)
        else {
            if ($currentItem && $currentItem.length) $currentItem.attr('tabindex', '0'); // Restore tabindex if focus didn't move
        }
    }

    /**
     * Handles keyboard navigation when the first option in the list has focus (ArrowUp).
     * Moves focus to the Select All button (multi-select only) or search input.
     * @private
     * @param {jQuery} $currentItem - The jQuery object of the currently focused list item.
     */
    _handleNavigationFromFirstOption($currentItem) {
        // Try to move focus to Select All first (multi-select only)
        if (!this.options.singleSelect && this.$selectAllDiv && this.$selectAllDiv.length && this.$selectAllDiv.is(':visible') && this.$selectAllDiv.attr('aria-disabled') !== 'true') {
            this._moveFocus($currentItem, this.$selectAllDiv); // Use moveFocus helper
            this._updateActiveDescendant(null); // Clear active descendant as focus is now on Select All
        }
        // If Select All is not available/enabled, try to move focus to the search input (if enabled)
        else if (this.options.enableSearch && this.$searchInput && this.$searchInput.length && this.$searchInput.is(':visible') && !this.$searchInput.prop('disabled')) {
            this._moveFocus($currentItem, this.$searchInput); // Use moveFocus helper
            this._updateActiveDescendant(null); // Clear active descendant as focus is now on the search input
        }
        // If no element above, keep focus on the first item
        else {
            if ($currentItem && $currentItem.length) $currentItem.attr('tabindex', '0'); // Restore tabindex if focus didn't move
        }
    }


    /**
     * Toggles the selected state of a given option element.
     * Only used in multi-select mode.
     * @private
     * @param {jQuery} $optionItem - The jQuery object of the option to toggle.
     */
    _toggleOptionSelection($optionItem) {
        if (this.options.singleSelect) {
            // In single select, this method should not be called directly for toggling
            console.warn(`[${this.containerId}] _toggleOptionSelection called in single-select mode. Use _handleOptionClick instead.`);
            return;
        }
        if ($optionItem && $optionItem.length) {
            $optionItem.toggleClass('selected-option');
            const isSelected = $optionItem.hasClass('selected-option');
            $optionItem.attr('aria-selected', isSelected ? 'true' : 'false');
        } else {
            console.warn(`[${this.containerId}] _toggleOptionSelection: Invalid option item provided.`);
        }
    }


    /**
     * Helper method to check if two arrays are equal (order-independent).
     * Used to determine if the selection state has actually changed.
     * @private
     * @param {Array<any>} arr1 - The first array.
     * @param {Array<any>} arr2 - The second array.
     * @returns {boolean} True if the arrays contain the same elements, regardless of order.
     */
    _areArraysEqual(arr1, arr2) {
        if (!Array.isArray(arr1) || !Array.isArray(arr2)) {
            return false;
        }
        if (arr1.length !== arr2.length) {
            return false;
        }
        const sortedArr1 = [...arr1].sort();
        const sortedArr2 = [...arr2].sort();
        for (let i = 0; i < sortedArr1.length; i++) {
            if (sortedArr1[i] !== sortedArr2[i]) {
                return false;
            }
        }
        return true;
    }

    /**
     * Triggers a custom 'change.customMultiSelect' event on the container element
     * if the selection state has changed since the last update.
     * @private
     */
    _triggerChangeEvent() {
        if (this.$container && this.$container.length) {
            const currentSelectedValues = this.getSelectedValues();
            const currentSelectedTexts = this.getSelectedTexts();

            // Check if the selection state has actually changed
            if (!this._areArraysEqual(currentSelectedValues, this._lastSelectedValues)) {
                // Update last recorded values *before* triggering the event
                this._lastSelectedValues = [...currentSelectedValues];
                this.$container.trigger('change.customMultiSelect', [currentSelectedValues, currentSelectedTexts]);
            }
        } else {
            console.warn(`[${this.containerId}] _triggerChangeEvent: Container element missing, cannot trigger event.`);
        }
    }


    // --- Public Methods (API) ---

    /**
     * Shows the dropdown list.
     * @public
     */
    showSelect() {
        if (this.isDisabled) {
            return;
        }
        if (this.$displayButton && this.$displayButton.length) this.$displayButton.attr('aria-expanded', 'true');
        if (this.$dropdownContainer && this.$dropdownContainer.length) this.$dropdownContainer.show();

        // Focus management after showing the dropdown
        if (this.options.enableSearch && this.$searchInput && this.$searchInput.length && this.$searchInput.is(':visible') && !this.$searchInput.prop('disabled')) {
            this.$searchInput.focus();
        } else if (!this.options.singleSelect && this.$selectAllDiv && this.$selectAllDiv.length && this.$selectAllDiv.is(':visible') && this.$selectAllDiv.attr('aria-disabled') !== 'true') {
            this.$selectAllDiv.focus();
        } else if (this.$customOptionsList && this.$customOptionsList.length) {
            const $firstOption = this.$customOptionsList.find('li:visible:not(.disabled-option)').first();
            if ($firstOption.length) {
                $firstOption.attr('tabindex', '0');
                $firstOption.focus();
            }
        }
    }

    /**
     * Hides the dropdown list.
     * @public
     */
    hideSelect() {
        if (this.$dropdownContainer && this.$dropdownContainer.length) this.$dropdownContainer.hide();
        if (this.$displayButton && this.$displayButton.length) this.$displayButton.attr('aria-expanded', 'false');

        this.updateDisplay(); // Update the display text

        // Clear search and show all options when hiding
        if (this.$searchInput && this.$searchInput.length) this.$searchInput.val('');
        if (this.$customOptionsList && this.$customOptionsList.length) this.$customOptionsList.find('li').show();

        // Ensure all list items have tabindex="-1" when the dropdown is hidden
        if (this.$customOptionsList && this.$customOptionsList.length) this.$customOptionsList.find('li').attr('tabindex', '-1');

        // Clear aria-activedescendant and any visual highlight
        this._updateActiveDescendant(null);

        // Clear live region text
        if (this.$liveRegion && this.$liveRegion.length) this.$liveRegion.text('');


        // Return focus to the display button if focus is still within the container
        if (this.$container && this.$container.length && this.$container.find(':focus').length > 0) {
            if (this.$displayButton && this.$displayButton.length) {
                this.$displayButton.focus();
            }
        }
    }

    /**
     * Toggles the selection state of all visible, enabled options.
     * Only applicable in multi-select mode.
     * @public
     */
    toggleSelectAll() {
        if (this.isDisabled || this.options.singleSelect) {
            return; // Only active in multi-select
        }

        if (!this.$customOptionsList || this.$customOptionsList.length === 0) {
            console.warn(`[${this.containerId}] toggleSelectAll: Options list missing.`);
            return;
        }

        // Operate only on visible, enabled options if search is active, otherwise all enabled options
        const $optionItems = (this.options.enableSearch && this.$searchInput && this.$searchInput.length && this.$searchInput.val() !== '')
            ? this.$customOptionsList.find('li:visible:not(.disabled-option)')
            : this.$customOptionsList.find('li:not(.disabled-option)');


        const totalOptions = $optionItems.length;
        if (totalOptions === 0) {
            return;
        }

        const selectedOptionsCount = $optionItems.filter('.selected-option').length;
        const allSelected = selectedOptionsCount === totalOptions;

        // Batch DOM updates for performance
        $optionItems.each(function () {
            const $item = $(this);
            if (!allSelected) {
                $item.addClass('selected-option').attr('aria-selected', 'true');
            } else {
                $item.removeClass('selected-option').attr('aria-selected', 'false');
            }
        });

        // --- FIX: Explicitly update the Select All button text here ---
        if (this.$selectAllDiv && this.$selectAllDiv.length) {
            this.$selectAllDiv.text(!allSelected ? 'Deselect All' : 'Select All');
        }
        // --- End FIX ---


        this.updateDisplay(); // Update the main display text
        this._triggerChangeEvent();

        // Keep focus on Select All button unless search is active, then focus search
        if (this.options.enableSearch && this.$searchInput && this.$searchInput.length && this.$searchInput.val() !== '') {
            this.$searchInput.focus();
        } else if (this.$selectAllDiv && this.$selectAllDiv.length) {
            this.$selectAllDiv.focus();
        }
    }

    /**
     * Enables the component, allowing user interaction.
     * @public
     */
    enable() {
        if (!this.isDisabled) {
            return;
        }
        this.isDisabled = false;
        this.$container.removeClass('disabled');

        // Re-bind events when enabling
        this._bindEvents();

        if (this.$displayButton && this.$displayButton.length) {
            this.$displayButton.prop('disabled', false).attr('tabindex', '0').removeClass('disabled-option');
        }
        if (this.$selectAllDiv && this.$selectAllDiv.length && !this.options.singleSelect) { // Only enable if not single select
            this.$selectAllDiv.attr('aria-disabled', 'false').attr('tabindex', '0').show().removeClass('disabled-option');
        }
        if (this.$customOptionsList && this.$customOptionsList.length) {
            this.$customOptionsList.find('li').each(function () {
                $(this).removeClass('disabled-option').attr('aria-disabled', 'false').attr('tabindex', '-1');
            });
        }
        if (this.options.enableSearch && this.$searchInput && this.$searchInput.length) {
            this.$searchInput.prop('disabled', false).show();
        }

    }

    /**
     * Disables the component, preventing user interaction.
     * @public
     */
    disable() {
        if (this.isDisabled) {
            return;
        }
        this.isDisabled = true;
        this.$container.addClass('disabled');

        this.hideSelect(); // Hide the dropdown if open

        // Unbind events when disabling
        this._unbindEvents();

        if (this.$displayButton && this.$displayButton.length) {
            this.$displayButton.prop('disabled', true).attr('tabindex', '-1').addClass('disabled-option');
        }
        if (this.$selectAllDiv && this.$selectAllDiv.length) { // Always disable Select All when component is disabled
            this.$selectAllDiv.attr('aria-disabled', 'true').attr('tabindex', '-1').addClass('disabled-option');
        }
        if (this.$customOptionsList && this.$customOptionsList.length) {
            this.$customOptionsList.find('li').each(function () {
                $(this).addClass('disabled-option').attr('aria-disabled', 'true').attr('tabindex', '-1');
            });
        }
        if (this.options.enableSearch && this.$searchInput && this.$searchInput.length) {
            this.$searchInput.prop('disabled', true).hide();
        }

    }

    /**
     * Gets the values of the currently selected options.
     * @public
     * @returns {Array<string>} An array of selected option values. Returns an empty array if no options are selected or the list is missing. In single-select mode, returns an array with at most one element.
     */
    getSelectedValues() {
        if (!this.$customOptionsList || this.$customOptionsList.length === 0) {
            console.warn(`[${this.containerId}] getSelectedValues: Options list missing.`);
            return [];
        }
        const $selectedItems = this.$customOptionsList.find('li.selected-option');
        return $selectedItems.map(function () {
            return $(this).attr('data-value');
        }).get();
    }

    /**
     * Gets the text content of the currently selected options.
     * @public
     * @returns {Array<string>} An array of selected option text contents. Returns an empty array if no options are selected or the list is missing. In single-select mode, returns an array with at most one element.
     */
    getSelectedTexts() {
        if (!this.$customOptionsList || this.$customOptionsList.length === 0) {
            console.warn(`[${this.containerId}] getSelectedTexts: Options list missing.`);
            return [];
        }
        const $selectedItems = this.$customOptionsList.find('li.selected-option');
        return $selectedItems.map(function () {
            // Optimized text extraction: cache text on load
            const cachedText = $(this).data('original-text');
            if (cachedText !== undefined) {
                return cachedText;
            } else {
                const text = $(this).text().replace(/\s*✔\s*$/, '').trim();
                $(this).data('original-text', text); // Cache the original text
                return text;
            }
        }).get();
    }

    /**
     * Sets the selected options based on an array of values.
     * Deselects all options first, then selects those matching the provided values.
     * Disabled options in the input array will not be selected.
     * In single-select mode, only the *last* value in the array will be selected.
     * @public
     * @param {Array<string>} values - An array of values to select.
     */
    setSelectedValues(values = []) {
        if (!Array.isArray(values)) {
            console.warn(`[${this.containerId}] setSelectedValues expects an array.`);
            return;
        }
        if (!this.$customOptionsList || this.$customOptionsList.length === 0) {
            console.warn(`[${this.containerId}] setSelectedValues: Options list missing.`);
            return;
        }

        // Store current state before changing for change event
        this._lastSelectedValues = this.getSelectedValues();

        // Deselect all first
        this.$customOptionsList.find('li.selected-option').removeClass('selected-option').attr('aria-selected', 'false');

        if (this.options.singleSelect) {
            // In single select, only process the last value if array is not empty
            if (values.length > 0) {
                const valueToSelect = values[values.length - 1];
                const $itemToSelect = this.$customOptionsList.find(`li[data-value="${valueToSelect}"]`);
                if ($itemToSelect.length) {
                    if (!$itemToSelect.hasClass('disabled-option')) {
                        $itemToSelect.addClass('selected-option').attr('aria-selected', 'true');
                    } else {
                        console.warn(`[${this.containerId}] Attempted to select disabled option with value: ${valueToSelect}`);
                    }
                } else {
                    console.warn(`[${this.containerId}] Option with value "${valueToSelect}" not found.`);
                }
            }
        } else {
            // Multi-select mode: Select all specified values
            values.forEach(value => {
                const $itemToSelect = this.$customOptionsList.find(`li[data-value="${value}"]`);
                if ($itemToSelect.length) {
                    if (!$itemToSelect.hasClass('disabled-option')) {
                        $itemToSelect.addClass('selected-option').attr('aria-selected', 'true');
                    } else {
                        console.warn(`[${this.containerId}] Attempted to select disabled option with value: ${value}`);
                    }
                } else {
                    console.warn(`[${this.containerId}] Option with value "${value}" not found.`);
                }
            });
        }


        // Clear search and show all options after setting values
        if (this.$searchInput && this.$searchInput.length) this.$searchInput.val('');
        if (this.$customOptionsList && this.$customOptionsList.length) this.$customOptionsList.find('li').show();
        this._updateActiveDescendant(null); // Clear active descendant


        this.updateDisplay();
        this._triggerChangeEvent();
    }

    /**
     * Sets the selected options based on an array of text contents.
     * Deselects all options first, then selects those matching the provided texts.
     * Disabled options matching the text will not be selected.
     * In single-select mode, only the *last* text in the array will be selected.
     * @public
     * @param {Array<string>} texts - An array of text contents to select.
     */
    setSelectedTexts(texts = []) {
        if (!Array.isArray(texts)) {
            console.warn(`[${this.containerId}] setSelectedTexts expects an array.`);
            return;
        }
        if (!this.$customOptionsList || this.$customOptionsList.length === 0) {
            console.warn(`[${this.containerId}] setSelectedTexts: Options list missing.`);
            return;
        }

        // Store current state before changing for change event
        this._lastSelectedValues = this.getSelectedValues();

        // Deselect all first
        this.$customOptionsList.find('li.selected-option').removeClass('selected-option').attr('aria-selected', 'false');

        if (this.options.singleSelect) {
            // In single select, only process the last text if array is not empty
            if (texts.length > 0) {
                const textToSelect = texts[texts.length - 1];
                this.$customOptionsList.find('li').each(function () {
                    const $itemToSelect = $(this);
                    // Optimized text extraction: use cached text
                    const itemText = $itemToSelect.data('original-text') || $itemToSelect.text().replace(/\s*✔\s*$/, '').trim();
                    if (!$itemToSelect.data('original-text')) {
                        $itemToSelect.data('original-text', itemText); // Cache if not already
                    }

                    if (itemText === textToSelect) {
                        if (!$itemToSelect.hasClass('disabled-option')) {
                            $itemToSelect.addClass('selected-option').attr('aria-selected', 'true');
                        } else {
                            console.warn(`[${this.containerId}] Attempted to select disabled option with text: ${textToSelect}`);
                        }
                        return false; // Stop searching once found
                    }
                });
            }
        } else {
            // Multi-select mode: Select all specified texts
            texts.forEach(text => {
                this.$customOptionsList.find('li').each(function () {
                    const $itemToSelect = $(this);
                    // Optimized text extraction: use cached text
                    const itemText = $itemToSelect.data('original-text') || $itemToSelect.text().replace(/\s*✔\s*$/, '').trim();
                    if (!$itemToSelect.data('original-text')) {
                        $itemToSelect.data('original-text', itemText); // Cache if not already
                    }

                    if (itemText === text) {
                        if (!$itemToSelect.hasClass('disabled-option')) {
                            $itemToSelect.addClass('selected-option').attr('aria-selected', 'true');
                        } else {
                            console.warn(`[${this.containerId}] Attempted to select disabled option with text: ${text}`);
                        }
                        return false; // Stop searching once found
                    }
                });
            });
        }


        // Clear search and show all options after setting texts
        if (this.$searchInput && this.$searchInput.length) this.$searchInput.val('');
        if (this.$customOptionsList && this.$customOptionsList.length) this.$customOptionsList.find('li').show();
        this._updateActiveDescendant(null); // Clear active descendant


        this.updateDisplay();
        this._triggerChangeEvent();
    }


    /**
     * Loads options into the component dynamically.
     * Clears existing options and adds new ones from the provided data array.
     * @public
     * @param {Array<object>} optionsData - An array of option objects, each with 'value' and 'text' properties. Optional 'selected' property (boolean).
     */
    loadSelectOptions(optionsData) {
        if (!Array.isArray(optionsData)) {
            console.warn(`[${this.containerId}] loadSelectOptions expects an array.`);
            return;
        }
        if (!this.$customOptionsList || this.$customOptionsList.length === 0) {
            console.warn(`[${this.containerId}] loadSelectOptions: Options list missing.`);
            return;
        }

        // Clear existing list items
        this.$customOptionsList.empty();

        // Add new list items from data
        optionsData.forEach((option, index) => {
            if (option && typeof option === 'object' && option.hasOwnProperty('value') && option.hasOwnProperty('text')) {
                const $newItem = $('<li></li>')
                    .attr('data-value', option.value)
                    .attr('tabindex', '-1')
                    .attr('role', 'option')
                    .attr('aria-selected', option.selected ? 'true' : 'false')
                    .text(option.text);

                $newItem.attr('id', `${this.containerId}_option_${index}`); // Ensure unique ID for aria-activedescendant

                // Add checkmark only for multi-select mode
                if (!this.options.singleSelect) {
                    $newItem.append($('<span class="checkmark bi bi-check"></span>'));
                }


                if (option.selected) {
                    this.$customOptionsList.find('li.selected-option').removeClass('selected-option').attr('aria-selected', 'false'); // Deselect any previous in single select
                    $newItem.addClass('selected-option');
                }
                // Disabled state from data (future enhancement)
                // if (option.disabled) {
                //     $newItem.addClass('disabled-option').attr('aria-disabled', 'true');
                // }

                // Cache the original text on the element's data
                $newItem.data('original-text', option.text.trim());

                this.$customOptionsList.append($newItem);
            } else {
                console.warn(`[${this.containerId}] loadSelectOptions: Skipping invalid option data at index ${index}:`, option);
            }
        });


        // Clear search and show all options after loading new data
        if (this.$searchInput && this.$searchInput.length) this.$searchInput.val('');
        if (this.$customOptionsList && this.$customOptionsList.length) this.$customOptionsList.find('li').show();
        this._updateActiveDescendant(null); // Clear active descendant
        if (this.$liveRegion && this.$liveRegion.length) this.$liveRegion.text(''); // Clear live region

        this.updateDisplay();
        this._lastSelectedValues = this.getSelectedValues(); // Initialize last selected values after loading
        this._triggerChangeEvent(); // Trigger change event as options have been loaded/selection potentially changed
    }

    /**
     * Shows the entire component.
     * @public
     */
    showComponent() {
        if (this.$container && this.$container.length) {
            this.$container.removeClass('hidden-component'); // Remove the hiding class
            // Re-bind events when showing the component
            this._bindEvents();
            // Ensure the display button is focusable when shown
            if (this.$displayButton && this.$displayButton.length) {
                this.$displayButton.attr('tabindex', '0');
            }
            // If the component was disabled, ensure it stays disabled visually
            if (this.isDisabled) {
                this.$container.addClass('disabled');
                if (this.$displayButton) this.$displayButton.prop('disabled', true).attr('tabindex', '-1');
                if (this.$selectAllDiv) this.$selectAllDiv.attr('aria-disabled', 'true').attr('tabindex', '-1');
                if (this.$customOptionsList) this.$customOptionsList.find('li').addClass('disabled-option').attr('aria-disabled', 'true').attr('tabindex', '-1');
                if (this.options.enableSearch && this.$searchInput) this.$searchInput.prop('disabled', true).hide();
            } else {
                // If not disabled, ensure elements are enabled and focusable
                if (this.$displayButton) this.$displayButton.prop('disabled', false).attr('tabindex', '0');
                if (this.$selectAllDiv && !this.options.singleSelect) this.$selectAllDiv.attr('aria-disabled', 'false').attr('tabindex', '0').show();
                if (this.$customOptionsList) this.$customOptionsList.find('li').removeClass('disabled-option').attr('aria-disabled', 'false').attr('tabindex', '-1');
                if (this.options.enableSearch && this.$searchInput) this.$searchInput.prop('disabled', false).show();
            }

            console.log(`[${this.containerId}] Component shown.`);
        } else {
            console.warn(`[${this.containerId}] showComponent: Container element missing.`);
        }
    }

    /**
     * Hides the entire component.
     * @public
     */
    hideComponent() {
        if (this.$container && this.$container.length) {
            // Hide the dropdown first if it's open
            this.hideSelect();
            this.$container.addClass('hidden-component'); // Add the hiding class
            // Unbind events when hiding the component to prevent interaction
            this._unbindEvents();
            // Ensure the display button is not focusable when hidden
            if (this.$displayButton && this.$displayButton.length) {
                this.$displayButton.attr('tabindex', '-1');
            }
            console.log(`[${this.containerId}] Component hidden.`);
        } else {
            console.warn(`[${this.containerId}] hideComponent: Container element missing.`);
        }
    }
}

// --- jQuery Plugin Definition ---
$.fn.customMultiSelect = function (options) { // Keeping plugin name for compatibility, but it's now a general select
    const originalArguments = arguments;

    return this.each(function () {
        const $container = $(this);
        let instance = $container.data('customMultiSelect');

        if (typeof options === 'string') {
            const methodName = options;
            const methodArgs = Array.prototype.slice.call(originalArguments, 1);

            if (!instance) {
                console.error(`Plugin: Attempted to call method "${methodName}" on an uninitialized element:`, this);
                return;
            }

            // Check if the method exists and is public (not starting with _)
            if (typeof instance[methodName] === 'function' && !methodName.startsWith('_')) {
                instance[methodName].apply(instance, methodArgs);
            } else {
                console.error(`Plugin: Public method "${methodName}" does not exist or is private on CustomMultiSelect instance for element:`, this);
            }
        } else {
            if (!instance) {
                instance = new CustomMultiSelect($container, options);
                $container.data('customMultiSelect', instance);
            }
        }
    });
};

$(document).ready(function () {
    $('.custom-multi-select').customMultiSelect();


    // --- Add event listener for visible label clicks to focus the button ---
    // This listener targets the visible labels associated with the display button
    $('label[for$="_display"]').on('click', function (event) {
        event.preventDefault(); // Prevent default label behavior

        const targetId = $(this).attr('for'); // Get the ID from the 'for' attribute
        const $targetElement = $('#' + targetId); // Find the associated element (the display button)

        if ($targetElement.length) {
            $targetElement.focus(); // Focus the display button
        } else {
            console.warn(`Element with ID "${targetId}" not found for label.`);
        }
    });
});