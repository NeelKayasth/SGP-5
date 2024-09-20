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
    $(".location-input").hide(); // Hide all location inputs
    $("#" + selectedValue).show(); // Show the selected location input
  });

  // Show/hide location input based on selected drop-off location
  $("#meet1").change(function () {
    var selectedValue = $(this).val();
    $(".location-input1").hide(); // Hide all drop-off location inputs
    $("#" + selectedValue + "1").show(); // Show the selected drop-off location input
  });

  // Handle booking ride button click
  $(document).on('click', '.book-ride-button', function () {
    var rideId = $(this).data('ride-id');  // Get the ride ID from data attribute

    // Disable button to prevent multiple clicks
    var $button = $(this);
    $button.prop('disabled', true);

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

        // Optionally update button text or disable it
        $button.text('Booked');
      },
      error: function (jqXHR, textStatus, errorThrown) {
        console.error('Error:', textStatus, errorThrown);  // Log error details
        UIkit.notification({
          message: 'Failed to book the ride. Please try again.',
          status: 'danger',
          pos: 'top-center',
          timeout: 5000
        });

        // Re-enable button in case of error
        $button.prop('disabled', false);
      }
    });
  });

  $(document).on('click', '.cancel-ride-button', function () {
    var rideId = $(this).data('ride-id');  // Get the ride ID from the data attribute

    // Disable button to prevent multiple clicks
    var $button = $(this);
    $button.prop('disabled', true);

    $.ajax({
      type: "POST",
      url: '/cancel-ride',  // Backend route for cancelling the ride
      data: { rideId: rideId },
      success: function (response) {
        UIkit.notification({
          message: 'Ride cancelled successfully!',
          status: 'success',
          pos: 'top-center',
          timeout: 5000
        });

        // Optionally update button text or remove the ride from the UI
        $button.text('Cancelled'); // Remove the row from the table
      },
      error: function (jqXHR, textStatus, errorThrown) {
        console.error('Error:', textStatus, errorThrown);  // Log error details
        UIkit.notification({
          message: 'Failed to cancel the ride. Please try again.',
          status: 'danger',
          pos: 'top-center',
          timeout: 5000
        });

        // Re-enable button in case of error
        $button.prop('disabled', false);
      }
    });
});

  // Handle registration form submission with AJAX
  // $("#registration-form").submit(function (event) {
  //   event.preventDefault();  // Prevent default form submission

    // var th = $(this);
    // var actionUrl = '/register' // Get the action attribute from the form

    // Collect all the form data
    // var formData = th.serialize();

    // $.ajax({
    //     type: "POST",
    //     url: actionUrl,
    //     data: $.param(formData),  // Serialize the updated form data
    //     success: function (response) {
            // Show success notification
            // UIkit.notification({
            //     message: response.message,  // Display the dynamic message from the backend
            //     status: 'success',    // Use the status ('success' or 'error') from the backend
            //     pos: 'top-center',
            //     timeout: 3000  // Set a 3-second timeout for the notification
            // });

            // // If registration is successful, redirect to login after showing the notification
            // if (response.status === 'success') {
            //     setTimeout(function () {
//                     window.location.href = '/login';  // Redirect to /login
//                 }, 1000);  // Delay the redirect by 1 second
//             }
//         },
//         error: function (jqXHR) {
//             var response = jqXHR.responseJSON;

//             // Show error notification
//             UIkit.notification({
//                 message: response.message || 'An error occurred during registration. Please try again.',
//                 status: 'danger',  // Always show danger status for errors
//                 pos: 'top-center',
//                 timeout: 3000  // Set a 3-second timeout for the notification
//             });

//             // Redirect to /register on error
//             setTimeout(function () {
//                 window.location.href = '/register';
//             }, 1000);  // Delay the redirect by 1 second
//         }
//     });
// });


  // Handle form submissions with AJAX
  // $("#offer-ride-form").submit(function (event) {
  //   event.preventDefault();  // Prevent default form submission

  //   var $form = $(this);
  //   var actionUrl = $form.attr('action');  // Get the action attribute from the form
  //   var redirectUrl = $form.data('redirect-url');  // Get the redirect URL from the data attribute
  //   var renderResults = $form.data('render-results');  // Custom attribute to determine if results should be rendered

  //   // Validate pickup and drop-off locations
  //   var meetLocation = $form.find("select[name='meet']").val();
  //   var dropoffLocation = $form.find("select[name='meet1']").val();

  //   if (meetLocation === dropoffLocation) {
  //     UIkit.notification({
  //       message: 'Pickup and drop-off locations cannot be the same.',
  //       status: 'danger',
  //       pos: 'top-center',
  //       timeout: 5000
  //     });
  //     return;
  //   }

  //   // Collect all the form data, including the conditional fields
  //   var formData = $form.serializeArray();

  //   // Ensure the correct location values are included based on user selections
  //   var meetLocationSpecific = $("#" + meetLocation + " input[name='meet_location']").val() || '';
  //   var dropoffLocationSpecific = $("#" + dropoffLocation + "1 input[name='meet_location1']").val() || '';

  //   if (meetLocationSpecific) {
  //     formData.push({ name: 'meet_location', value: meetLocationSpecific });
  //   }
  //   if (dropoffLocationSpecific) {
  //     formData.push({ name: 'meet_location1', value: dropoffLocationSpecific });
  //   }

  //   // Validate seat input when 4 Wheeler is selected
  //   var vehicleType = formData.find(item => item.name === 'vehicle')?.value;
  //   var seatValue = formData.find(item => item.name === 'seat')?.value;

  //   if (vehicleType === '4' && (isNaN(seatValue) || seatValue < 1 || seatValue > 8)) {
  //     UIkit.notification({
  //       message: 'Please enter a valid number of seats (1-8) for a 4 Wheeler.',
  //       status: 'danger',
  //       pos: 'top-center',
  //       timeout: 5000
  //     });
  //     return;
  //   }

  //   // Disable submit button to prevent multiple submissions
  //   var $submitButton = $form.find('button[type="submit"]');
  //   $submitButton.prop('disabled', true);

  //   // Perform the AJAX request
  //   $.ajax({
  //     type: "POST",
  //     url: actionUrl,  // Use the form's action attribute as the URL
  //     data: $.param(formData),  // Serialize the updated form data
  //     success: function (response) {
  //       UIkit.notification({
  //         message:response.message ||'Ride offered a succesfully',
  //         status: 'success',
  //         pos: 'top-center',
  //         timeout: 5000
  //       });

  //       // Check if we need to render results or redirect
  //       if (renderResults) {
  //         // Render the search-results.ejs with the results
  //         $("body").html(response);
  //       } else {
  //         setTimeout(function () {
  //           if (redirectUrl) {
  //             window.location.href = redirectUrl;
  //           } else {
  //             window.location.href = '/offer-ride';
  //           }
  //         }, 1000);
  //       }
  //     },
  //     error: function (jqXHR, textStatus, errorThrown) {
  //       console.error('Error:', textStatus, errorThrown);  // Log error details
  //       UIkit.notification({
  //         message: 'There was an error for offering a ride. Please try again.',
  //         status: 'danger',
  //         pos: 'top-center',
  //         timeout: 5000
  //       });
  //     },
  //     complete: function () {
  //       // Re-enable the submit button after the request completes
  //       $submitButton.prop('disabled', false);
  //     }
  //   });
  // });
  $("#offer-ride-form").submit(function (event) {
    event.preventDefault();  // Prevent default form submission

    var $form = $(this);
    var actionUrl = $form.attr('action');  // Get the action attribute from the form
    var redirectUrl = $form.data('redirect-url');  // Get the redirect URL from the data attribute
    var renderResults = $form.data('render-results');  // Custom attribute to determine if results should be rendered

    // Validate pickup and drop-off locations
    var meetLocation = $form.find("select[name='meet']").val();
    var dropoffLocation = $form.find("select[name='meet1']").val();

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
    var formData = $form.serializeArray();

    // Ensure the correct location values are included based on user selections
    var meetLocationSpecific = $("#" + meetLocation + " input[name='meet_location']").val() || '';
    var dropoffLocationSpecific = $("#" + dropoffLocation + "1 input[name='meet_location1']").val() || '';

    if (meetLocationSpecific) {
        formData.push({ name: 'meet_location', value: meetLocationSpecific });
    }
    if (dropoffLocationSpecific) {
        formData.push({ name: 'meet_location1', value: dropoffLocationSpecific });
    }

    // Disable submit button to prevent multiple submissions
    var $submitButton = $form.find('button[type="submit"]');
    $submitButton.prop('disabled', true);

    // Perform the AJAX request
    $.ajax({
        type: "POST",
        url: actionUrl,  // Use the form's action attribute as the URL
        data: $.param(formData),  // Serialize the updated form data
        success: function (response) {
            // Display flash message using UIkit notifications
            UIkit.notification({
                message: response.message || 'Ride offered successfully!',
                status: response.success ? 'success' : 'danger',
                pos: 'top-center',
                timeout: 5000
            });

            // Check if the ride was offered successfully and handle redirection
            if (response.success) {
                setTimeout(function () {
                    if (response.redirectUrl) {
                        window.location.href = response.redirectUrl;
                    } else {
                        window.location.href = '/offer-ride';
                    }
                }, 1000);
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.error('Error:', textStatus, errorThrown);  // Log error details
            UIkit.notification({
                message: 'There was an error offering the ride. Please try again.',
                status: 'danger',
                pos: 'top-center',
                timeout: 5000
            });
        },
        complete: function () {
            // Re-enable the submit button after the request completes
            $submitButton.prop('disabled', false);
        }
    });
});

});
