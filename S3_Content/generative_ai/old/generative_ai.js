"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
function Autobind(_, _2, descriptor) {
    const originalMethod = descriptor.value;
    const adjDescriptor = {
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
    constructor() {
        this.inputFormElement = document.getElementById('inputForm');
        this.inputFieldElement = this.inputFormElement.querySelector('#inputField');
        this.configure();
    }
    configure() {
        this.inputFormElement.addEventListener('submit', this.submitHandler);
    }
    submitHandler(event) {
        event.preventDefault();
        const value = this.inputFieldElement.value;
        const inputData = {
            prompt: value
        };
        try {
            $.ajax({
                url: 'https://www.metalmental.net/prod/sentenceGeneration',
                type: 'POST',
                data: JSON.stringify(inputData),
                contentType: 'application/json; charset=utf-8',
                dataType: 'json',
                async: true,
                success: function (response) {
                    const message = JSON.parse(response.body).prompt;
                    $('#outputField').text(message);
                },
                error: function (_1, _2, error) {
                    $('#outputField').text(`${error}`);
                }
            });
        }
        catch (error) {
            $('#outputField').text(`${error}`);
        }
    }
}
__decorate([
    Autobind
], GenerativeAI.prototype, "submitHandler", null);
const generativeAI = new GenerativeAI();
//# sourceMappingURL=generative_ai.js.map