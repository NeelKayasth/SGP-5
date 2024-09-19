"use strict";

jQuery(document).ready(function ($) {
  // Initialize date picker
  $('.js-data').datepicker({
    language: "en"
  });

  // Preloader fade out
  var $preloader = $('#page-preloader'),
    $spinner = $preloader.find('.spinner-loader');
  $spinner.fadeOut();
  $preloader.delay(50).fadeOut('slow');

  // Show/hide location input based on selected meeting location
  $("#meet").change(function () {
    var selectedValue = $(this).val();
    $(".location-input").hide();
    $("#" + selectedValue).show();
  });

  // Show/hide location input based on selected drop-off location
  $("#meet1").change(function () {
    var selectedValue = $(this).val();
    $(".location-input1").hide();
    $("#" + selectedValue + "1").show();
  });

    

  $(document).on('click', '.book-ride-button', function () {
    var rideId = $(this).data('ride-id');  // Get the ride ID from data attribute

    $.ajax({
      type: "POST",
      url: '/book',
      data: { rideId: rideId },
      success: function (response) {
        UIkit.notification({
          message: 'Ride booked successfully!',
          status: 'success',
          pos: 'top-center',
          timeout: 5000
        });
        
        // Optionally disable the button or update its text
        $('.book-ride-button[data-ride-id="' + rideId + '"]').prop('disabled', true).text('Booked'); 
      },
      error: function (jqXHR, textStatus, errorThrown) {
        console.error('Error:', textStatus, errorThrown);  // Log error details
        UIkit.notification({
          message: 'Failed to book the ride. Please try again.',
          status: 'danger',
          pos: 'top-center',
          timeout: 5000
        });
      }
    });
  });


  // Handle form submissions with AJAX
  $("form").submit(function (event) {
    event.preventDefault();  // Prevent default form submission

    var th = $(this);
    var actionUrl = th.attr('action');  // Get the action attribute from the form
    var redirectUrl = th.data('redirect-url');  // Get the redirect URL from the data attribute
    var renderResults = th.data('render-results');  // Custom attribute to determine if results should be rendered

    // Validate pickup and drop-off locations
    var meetLocation = th.find("select[name='meet']").val();
    var dropoffLocation = th.find("select[name='meet1']").val();

    if (meetLocation === dropoffLocation) {
      UIkit.notification({
        message: 'Pickup and drop-off locations cannot be the same.',
        status: 'danger',
        pos: 'top-center',
        timeout: 5000
      });
      return;
    }

    // Collect all the form data, including the conditional fields
    var formData = th.serializeArray();

    // Ensure the correct location values are included based on user selections
    var meetLocationSpecific = $("#" + meetLocation + " input[name='meet_location']").val() || '';
    var dropoffLocationSpecific = $("#" + dropoffLocation + "1 input[name='meet_location1']").val() || '';

    if (meetLocationSpecific) {
      formData.push({ name: 'meet_location', value: meetLocationSpecific });
    }
    if (dropoffLocationSpecific) {
      formData.push({ name: 'meet_location1', value: dropoffLocationSpecific });
    }

    // Validate seat input when 4 Wheeler is selected
    var vehicleType = formData.find(item => item.name === 'vehicle')?.value;
    var seatValue = formData.find(item => item.name === 'seat')?.value;

    if (vehicleType === '4' && (isNaN(seatValue) || seatValue < 1 || seatValue > 8)) {
      UIkit.notification({
        message: 'Please enter a valid number of seats (1-8) for a 4 Wheeler.',
        status: 'danger',
        pos: 'top-center',
        timeout: 5000
      });
      return;
    }

    $.ajax({
      type: "POST",
      url: actionUrl,  // Use the form's action attribute as the URL
      data: $.param(formData),  // Serialize the updated form data
      success: function (response) {
        UIkit.notification({
          message: 'Form sent successfully!',
          status: 'success',
          pos: 'top-center',
          timeout: 5000
        });

        // Check if we need to render results or redirect
        if (renderResults) {
          // Render the search-results.ejs with the results
          $("body").html(response);
        } else {
          setTimeout(function () {
            if (redirectUrl) {
              window.location.href = redirectUrl;
            } else {
              window.location.href = '/';
            }
          }, 1000);
        }
      },
      error: function (jqXHR, textStatus, errorThrown) {
        console.error('Error:', textStatus, errorThrown);  // Log error details
        UIkit.notification({
          message: 'There was an error sending the form. Please try again.',
          status: 'danger',
          pos: 'top-center',
          timeout: 5000
        });
      }
    });
  });
});
