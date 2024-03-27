class GenerativeAI {

    constructor() {
        // npm install --save @types/jquery
        $('#inputForm').on('submit', this.submitHandler);
    }

    private submitHandler(event: Event) {
        event.preventDefault();
        const value = $('#inputField').val() as string;
        const inputData = {
            key: value
        };

        $.ajax({
            // invoke Lambda named generativeAI
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