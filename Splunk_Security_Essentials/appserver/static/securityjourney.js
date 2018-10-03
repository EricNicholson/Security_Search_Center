require([
    'underscore',
    'jquery',
    'splunkjs/mvc',
    'splunkjs/mvc/simplexml/ready!'
], function(_, $, mvc){


$(".panel-body").css("min-height","1150px").css("min-width","1600px")


var slider = document.getElementById("journeyslider");
var values = [60, 220, 390, 565, 730, 895];
slider.value = values[0];
slider.min = 0;
slider.max = 1000;
slider.animate = 500;
slider.oninput = function(event, ui) {
  slider.value = _getClosest(slider.value);
}

if(navigator.userAgent.toLowerCase().indexOf('firefox') > -1){
     slider.style.visibility='hidden' 
}

function _getClosest(value) {
  var closest = null;
  $.each(values, function(_key, _value) {
    if (closest == null || Math.abs(this - value) < Math.abs(closest - value)) {
      closest = this;
      drawstage(_key + 1)
    }
  });
  return closest;
}

drawstage(1);


$("#stage1").on("click", function() {
  drawstage(1);
});
$("#stage2").on("click", function() {
  drawstage(2);
});
$("#stage3").on("click", function() {
  drawstage(3);
});
$("#stage4").on("click", function() {
  drawstage(4);
});
$("#stage5").on("click", function() {
  drawstage(5);
});
$("#stage6").on("click", function() {
  drawstage(6);
});


if(window.location.href.indexOf("stage=") >- 0){
  
    drawstage( parseInt(window.location.href.replace(/^.*?\?/, "").replace(/^.*?stage=/, "").replace(/[^\d].*$/, "")) )
  
}
$("#panel1").css("min-width", "1400px")
$("body").css("min-width", "1420px")

function drawstage(stage) {
  slider.value = values[stage - 1]
  $("#numbercircle").html(stage);

  drawallharveys([0, 0, 0, 0, 0, 0, 0, 0, 0]);

  switch (stage) {
    case 1:
      $("#stage1").removeClass("stage1dark");
      $("#stage2").addClass("stage2dark");
      $("#stage3").addClass("stage3dark");
      $("#stage4").addClass("stage4dark");
      $("#stage5").addClass("stage5dark");
      $("#stage6").addClass("stage6dark");
      drawallharveys([25, 25, 25, 25, 0, 0, 25, 0, 0]);
      $("#stagedesccontent").html($("#stage1description").html());
      $("#stagemilestonecontent").html($("#stage1milestone").html());
      $("#stagechallengecontent").html($("#stage1challenge").html());
      $("#stagedatasourcecontent").html($("#stage1datasource").html());
      break;
    case 2:
      $("#stage1").removeClass("stage1dark");
      $("#stage2").removeClass("stage2dark");
      $("#stage3").addClass("stage3dark");
      $("#stage4").addClass("stage4dark");
      $("#stage5").addClass("stage5dark");
      $("#stage6").addClass("stage6dark");
      drawallharveys([25, 25, 25, 25, 25, 25, 25, 0, 0]);
      $("#stagedesccontent").html($("#stage2description").html());
      $("#stagemilestonecontent").html($("#stage2milestone").html());
      $("#stagechallengecontent").html($("#stage2challenge").html());
      $("#stagedatasourcecontent").html($("#stage2datasource").html());
      break;
    case 3:
      $("#stage1").removeClass("stage1dark");
      $("#stage2").removeClass("stage2dark");
      $("#stage3").removeClass("stage3dark");
      $("#stage4").addClass("stage4dark");
      $("#stage5").addClass("stage5dark");
      $("#stage6").addClass("stage6dark");
      drawallharveys([50, 25, 50, 50, 25, 50, 25, 0, 0]);
      $("#stagedesccontent").html($("#stage3description").html());
      $("#stagemilestonecontent").html($("#stage3milestone").html());
      $("#stagechallengecontent").html($("#stage3challenge").html());
      $("#stagedatasourcecontent").html($("#stage3datasource").html());
      break;
    case 4:
      $("#stage1").removeClass("stage1dark");
      $("#stage2").removeClass("stage2dark");
      $("#stage3").removeClass("stage3dark");
      $("#stage4").removeClass("stage4dark");
      $("#stage5").addClass("stage5dark");
      $("#stage6").addClass("stage6dark");
      drawallharveys([75, 25, 75, 75, 50, 75, 25, 0, 0]);
      $("#stagedesccontent").html($("#stage4description").html());
      $("#stagemilestonecontent").html($("#stage4milestone").html());
      $("#stagechallengecontent").html($("#stage4challenge").html());
      $("#stagedatasourcecontent").html($("#stage4datasource").html());
      break;
    case 5:
      $("#stage1").removeClass("stage1dark");
      $("#stage2").removeClass("stage2dark");
      $("#stage3").removeClass("stage3dark");
      $("#stage4").removeClass("stage4dark");
      $("#stage5").removeClass("stage5dark");
      $("#stage6").addClass("stage6dark");
      drawallharveys([100, 50, 100, 100, 100, 75, 25, 0, 0]);
      $("#stagedesccontent").html($("#stage5description").html());
      $("#stagemilestonecontent").html($("#stage5milestone").html());
      $("#stagechallengecontent").html($("#stage5challenge").html());
      $("#stagedatasourcecontent").html($("#stage5datasource").html());

      break;
    case 6:
      $("#stage1").removeClass("stage1dark");
      $("#stage2").removeClass("stage2dark");
      $("#stage3").removeClass("stage3dark");
      $("#stage4").removeClass("stage4dark");
      $("#stage5").removeClass("stage5dark");
      $("#stage6").removeClass("stage6dark");
      drawallharveys([100, 50, 100, 100, 100, 100, 100, 0, 0]);
      $("#stagedesccontent").html($("#stage6description").html());
      $("#stagemilestonecontent").html($("#stage6milestone").html());
      $("#stagechallengecontent").html($("#stage6challenge").html());
      $("#stagedatasourcecontent").html($("#stage6datasource").html());
      break;
  }

}

function drawallharveys(percvector) {
  $("#security_monitoring_fh").html(drawflatharvey(percvector[0]));
  $("#compliance_fh").html(drawflatharvey(percvector[1]));
  $("#incident_investigation_fh").html(drawflatharvey(percvector[2]));
  $("#incident_response_fh").html(drawflatharvey(percvector[3]));
  $("#soc_automation").html(drawflatharvey(percvector[4]));
  $("#advanced_threat_fh").html(drawflatharvey(percvector[5]));
  $("#insider_threat_fh").html(drawflatharvey(percvector[6]));
  $("#fraud_fh").html(drawflatharvey(percvector[7]));
  $("#application_security_fh").html(drawflatharvey(percvector[8]));
}

function drawflatharvey(perc) {
  var html = "";
  switch (perc) {
    case 0:
      html += '<div class="flatharveydashgray"></div>'
      html += '<div class="flatharveydashgray"></div>'
      html += '<div class="flatharveydashgray"></div>'
      html += '<div class="flatharveydashgray"></div>'
      break;

    case 25:
      html += '<div class="flatharveydashblue"></div>'
      html += '<div class="flatharveydashgray"></div>'
      html += '<div class="flatharveydashgray"></div>'
      html += '<div class="flatharveydashgray"></div>'
      break;

    case 50:
      html += '<div class="flatharveydashblue"></div>'
      html += '<div class="flatharveydashblue"></div>'
      html += '<div class="flatharveydashgray"></div>'
      html += '<div class="flatharveydashgray"></div>'
      break;

    case 75:
      html += '<div class="flatharveydashblue"></div>'
      html += '<div class="flatharveydashblue"></div>'
      html += '<div class="flatharveydashblue"></div>'
      html += '<div class="flatharveydashgray"></div>'
      break;

    case 100:
      html += '<div class="flatharveydashblue"></div>'
      html += '<div class="flatharveydashblue"></div>'
      html += '<div class="flatharveydashblue"></div>'
      html += '<div class="flatharveydashblue"></div>'
      break;
  }
  return html;
}
})
