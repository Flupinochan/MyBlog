"use strict";
class GenerativeAI {
    constructor() {
        $('#inputForm').on('submit', this.submitHandler);
    }
    submitHandler(event) {
        event.preventDefault();
        const value = $('#inputField').val();
        const inputData = {
            key: value
        };
        $.ajax({
            url: 'https://yxwhufw84i.execute-api.ap-northeast-1.amazonaws.com/prod/sentenceGeneration',
            type: 'POST',
            data: JSON.stringify(inputData),
            contentType: 'application/json; charset=utf-8',
            dataType: 'json',
            async: true,
            success: function (response) {
                const message = response.message;
                $('#outputField').text(message);
            },
            error: function (_1, _2, error) {
                $('#outputField').text(`${error}`);
            }
        });
    }
}
const generativeAI = new GenerativeAI();
//# sourceMappingURL=generative_ai.js.map