function Autobind(_: any, _2: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const adjDescriptor: PropertyDescriptor = {
        configurable: true,
        enumerable: false,
        get() {
            const boundFn = originalMethod.bind(this);
            return boundFn;
        },
    };
    return adjDescriptor;
}

class GenerativeAI {

    inputFormElement: HTMLFormElement;
    inputFieldElement: HTMLInputElement;

    constructor() {
        this.inputFormElement = document.getElementById('inputForm')! as HTMLFormElement;
        this.inputFieldElement = this.inputFormElement.querySelector('#inputField')! as HTMLInputElement;

        this.configure();
    }

    private configure() {
        this.inputFormElement.addEventListener('submit', this.submitHandler);
    }

    @Autobind
    private submitHandler(event: Event) {
        event.preventDefault();
        const value = this.inputFieldElement.value;
        const inputData = {
            prompt: value
        };

        // npm install --save @types/jquery
        try {
            $.ajax({
                // invoke Lambda named generativeAI
                url: 'https://yxwhufw84i.execute-api.ap-northeast-1.amazonaws.com/prod/sentenceGeneration',
                type: 'POST',
                data: JSON.stringify(inputData),
                contentType: 'application/json; charset=utf-8',
                dataType: 'json',
                async: true,
                success: function (response) {
                    const message = JSON.parse(response.body).prompt;
                    const marked = require('marked');
                    const htmlMessage = marked(message);
                    // $('#outputField').text(message);
                    $('#outputField').html(message);
                },
                error: function (_1, _2, error) {
                    $('#outputField').text(`${error}`);
                }
            })
        } catch (error) {
            $('#outputField').text(`${error}`);
        }

    }
}

const generativeAI = new GenerativeAI();