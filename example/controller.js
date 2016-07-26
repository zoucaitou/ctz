ctz.Register('contoller', function() {

	var Test = ctz.Controller.create({
					
		el: $("#template"),
        
        elements: {
        	"button": "btn"
        },
        
        events: {
        	"click button": "whatever"
        },
        
        init: function() {
        	alert('init...')
            ctz.Ajax.get('aa', function(){})
            ctz.Ajax.post('aa', {a: 1}, function(){})
        },
        
        whatever: function() {
        	
        	alert("hi,you click me once...");
        	alert("hi,you text is ["+ this.btn.text() + "]");
        	alert("guid "+ ctz.Identity.guid());
        }
		
    });

    return Test;

}) ;