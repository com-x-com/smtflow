window.onload = function() {
	let dataDiv = Win.getId('dataDiv');
	Win.ajax({
		url: './data/data.json',
		success: function(data) {
			for(let i= 0;i<data.length; i ++) {
				let dataRow = Win.cr('div');
				dataRow.innerHTML = data[i].title;
				Win.click(dataRow, function(){
					smt.flow('loadData', data[i]);
					dataDiv.style.display = 'none';
				})
				dataDiv.appendChild(dataRow);
			}
		}
	});

	let smt = $$('#flow').flow({
		title: '流程图',
		//editable: true,
		//showNodeTitle: true,
		//showFooter: false,
		thumbnail: true,
		// 默认1 大于1工作区将产生滚动条
		areaRatio: 1.5,
		footer: '北京XXXX信息技术有限公司',
		lineType: 'polyline',
		//language: 'en',
		tools: [
			{title: '时间', icon: 'time'},
			{title: '查询', icon: 'search'},
			{title: 'Offer', icon: 'offer'},
			{title: '设置', icon: 'setting'},
			{title: '短信', icon: 'sms'},
			{title: '微信', icon: 'wechat'},
			{type: 'separate'},
			{title: '拆分', icon: 'split'},
			{title: '合并', icon: 'merge'}
		],
		onClickNew: function() {
			return confirm('确定新建?');
			//return false; 返回false 不新建工作区
		},
		onClickOpen: function() {
			console.info('onClickOpen');
			dataDiv.style.display = 'block';
		},
		onClickSave: function(data) {
			console.info('onClickSave')
			console.info(data);
			smt.flow('setMessage', data);
			console.info('保存数据...')
		},
		// 删除节点
		onRemoveNode: function(id, type) {
			console.info('onRemoveNode')
			console.info(id, type)
			//return false; 返回false 不删除节点
		},
		onSettingNode: function(id, type) {
			console.info('onSettingNode')
			console.info(id, type)
			window.open('https://http.la')
		},
		// 双击节点
		onDblclick: function(id, type) {
			console.info('onDblclick')
			console.info(id, type)
		},
		// 新增节点
		onAddNode: function(type) {
			console.info('onAddNode')
			console.info(type)
		},
		// 增加连线
		onAddLine: function(from, to) {
			console.info('onAddLine')
			console.info(from, to)
		},
		// 加载完成
		onLoadSuccess: function() {
			console.info('success');
		}
	});
				
	Win.click('btn0', function(){
		smt.flow('disable');
	});
	Win.click('btn1', function(){
		smt.flow('enable');
	})
	Win.click('btn2', function(){
		smt.flow('setTitle', new Date().getTime());
	})
	Win.click('btn3', function() {
		smt.flow('setLineType', 'line');
	})
	Win.click('btn4', function() {
		smt.flow('setLineType', 'polyline');
	})
	Win.click('btn5', function() {
		smt.flow('setShowNodeTitle', true);
	})
	Win.click('btn6', function() {
		smt.flow('setShowNodeTitle', false);
	})
	Win.click('btn7', function() {
		smt.flow('setMessage', {content:"测试消息方法" + new Date().getTime(), time: 4000});
	})
	Win.click('btn8', function(){
		let node = smt.flow('getNode', 'N1639836073413102');
		console.info(node);
	});
	Win.click('btn9', function(){
		let node = smt.flow('getLine', 'L1639836074617103');
		console.info(node);
	})
	
}
let Win = {
	getId: function(id) {
		return document.getElementById(id);
	},
	getEl: function(s) {
		return document.querySelector(s);
	},
	getElAll: function(s) {
		return document.querySelectorAll(s);
	},
	click: function (obj, click) {
		if(typeof(obj) == 'string') {			
			Win.getId(obj).onclick = click;
		}
		else {
			obj.onclick = click;
		}
	},
	cr: function(tag) {
		return document.createElement(tag);
	},
	ajax: function (options) {
		let request = new XMLHttpRequest();
		let type = typeof(options.type) == "undefined" ? 'get' : options.type;
		request.open(type, options.url);
		request.send(null);
		request.onload = function() {
			if(request.status == 200) {
				let responseText = request.responseText;
				let data = typeof(options.dataType) == 'undefined' || options.dataType == 'json' ? JSON.parse(responseText) : responseText;
				if(!!options.success)options.success(data);
			}
		}
	}
}