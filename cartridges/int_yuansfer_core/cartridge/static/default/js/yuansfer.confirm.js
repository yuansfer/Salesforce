/* eslint-disable no-console */
/* eslint-disable no-alert */
// v3
var orderNumber = document.getElementById('yuansfer_order_number').value;
var merchantNo = document.getElementById('yuansfer_merchant_number').value;
var storeNo = document.getElementById('yuansfer_store_number').value;
var token = document.getElementById('yuansfer_token').value;
var _redirectUrl = document.getElementById('yuansfer_home_show').value;

function calculateVerifySign(contents) {
    //1.对参数进行排序，然后用a=1&b=2..的形式拼接
    var sortArray = [];

    Object.keys(contents).sort().forEach(function (k) {
      if (contents[k] || contents[k] === false) {
        sortArray.push(k + '=' + contents[k]);
      }
    });

    //对token进行md5，得到的结果追加到sortArray之后
    sortArray.push(MD5(token));

    var tempStr = sortArray.join('&');
    // console.log('tempStr:', tempStr);

    //对tempStr 再进行一次md5加密得到verifySign
    var verifySign = MD5(tempStr);
    // console.log('veirfySign:', verifySign)

    return verifySign;
}

var _GetYuansferParams = function() {
    var params = {
        merchantNo:merchantNo,
        storeNo: storeNo,
        reference:token+orderNumber,
    }
    var verifySign = calculateVerifySign(params);
    params['verifySign'] = verifySign;
    return params;
}

var _RedirectCallback = function() {
    var _n=1;
    var m=setInterval(function(){
        _n--;
        if(_n==0){
            clearInterval(m);
            window.location.href = _redirectUrl+"?status="+_status;
        }
    },3000);
};

var _Polling =function(_queryUrl, _redirectUrl){
    var _num = 500;
    var params = _GetYuansferParams();
    var t=setInterval(function(){
        _num--;
        $.ajax({
            url: document.getElementById('yuansfer_handle_confirm_url').value,
            type: 'GET',
            dataType:"json",
            headers: {
                'params':params
            },
        }).done(function (json) {
                if(null != json){
                    var _ret_code = json.ret_code;
                    var _ret_msg = json.ret_msg;
                    _status = json.result.status;
                    if (_ret_code=="000100") {
                        if  (_status=="fail") {
                            clearInterval(t);
                            document.getElementById("_message").innerText="支付失败";
                        } else if (_status=="success") {
                            clearInterval(t);
                            document.getElementById("_message").innerText="支付成功";
                            _RedirectCallback();                     
                        } else {
                            //continue
                        }
                    } else if (_ret_code="000000") {
                        layer.msg(_ret_msg);
                    }
                }else{
                    layer.msg("query error");
                }
            }).fail(function(err){
               layer.msg(err); 
            }); 
        if(_num==0){
            clearInterval(t)
        };
    },4000);

};

function ready(fn){

    if(document.addEventListener){
        //标准浏览器
        document.addEventListener("DOMContentLoaded",function(){
            //注销事件，避免反复触发
            document.removeEventListener("DOMContentLoaded",arguments.callee,false);
            //执行函数
            fn;
        },false);
    }else if(document.attachEvent){
        //IE浏览器
        document.attachEvent("onreadystatechange",function(){
            if(document.readyState=="complete"){
                document.detachEvent("onreadystatechange",arguments.callee);
                //执行函数
                fn;
            }
        });
    }
}

ready(_Polling(_queryUrl, _redirectUrl));

