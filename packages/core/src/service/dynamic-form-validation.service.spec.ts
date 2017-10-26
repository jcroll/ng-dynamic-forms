import { TestBed, inject } from "@angular/core/testing";
import { ReactiveFormsModule, FormControl, NG_VALIDATORS, NG_ASYNC_VALIDATORS } from "@angular/forms";
import { DynamicFormValidationService } from "./dynamic-form-validation.service";
import { DynamicFormControlModel } from "../model/dynamic-form-control.model";
import { DynamicFormGroupModel } from "../model/form-group/dynamic-form-group.model";
import { DynamicInputModel } from "../model/input/dynamic-input.model";

describe("DynamicFormValidationService test suite", () => {

    let service: DynamicFormValidationService;

    function testValidator() {
        return {testValidator: {valid: true}};
    }

    function testAsyncValidator() {
        return new Promise<boolean>(resolve => setTimeout(() => resolve(true), 0));
    }

    beforeEach(() => {

        TestBed.configureTestingModule({
            imports: [ReactiveFormsModule],
            providers: [
                DynamicFormValidationService,
                {provide: NG_VALIDATORS, useValue: testValidator, multi: true},
                {provide: NG_ASYNC_VALIDATORS, useValue: testAsyncValidator, multi: true}
            ]
        });
    });

    beforeEach(inject([DynamicFormValidationService],
        (validationService: DynamicFormValidationService) => service = validationService));


    it("should resolve a validator by name correctly", () => {

        expect(service.getValidator("required")).toBeTruthy();
        expect(service.getValidator("testValidator")).toBeTruthy();
    });


    it("should resolve a async validator by name correctly", () => {

        expect(service.getAsyncValidator("testAsyncValidator")).toBeTruthy();
    });


    it("should resolve validators from config correctly", () => {

        let config: any = {required: null, maxLength: 7, minLength: 3},
            validators = service.getValidators(config);

        expect(validators.length === Object.keys(config).length).toBe(true);
    });


    it("should resolve custom validators from config correctly", () => {

        let config: any = {required: null, maxLength: 7, testValidator: null},
            validators = service.getValidators(config);

        expect(validators.length === Object.keys(config).length).toBe(true);
    });


    it("should resolve custom validators from detailed config correctly", () => {

        let config: any = {testValidator: {name: testValidator.name, args: null}},
            validators = service.getValidators(config);

        expect(validators.length === Object.keys(config).length).toBe(true);
    });


    it("should resolve custom async validators from config correctly", () => {

        let config: any = {testAsyncValidator: null},
            validators = service.getAsyncValidators(config);

        expect(validators.length === Object.keys(config).length).toBe(true);
    });



    it("should throw when validator is not provided via NG_VALIDATORS", () => {

        expect(() => service.getValidator("test", null))
            .toThrow(new Error(`validator "test" is not provided via NG_VALIDATORS or NG_ASYNC_VALIDATORS`));
    });


    it("should create error messages correctly", () => {

        let errorMessages,
            testControl: FormControl = new FormControl(),
            testGroupModel: DynamicFormGroupModel = new DynamicFormGroupModel({
                id: "testGroupModel",
                errorMessages: {
                    required: "Group is required",
                }
            }),
            testModel: DynamicFormControlModel = new DynamicInputModel({
                id: "testModel",
                errorMessages: {
                    required: "Field is required",
                    minLength: 5,
                    custom1: "Field {{ id }} has a custom error",
                    custom2: "Field has a custom error: {{ validator.param }}"
                }
            });

        errorMessages = service.createErrorMessages(testControl, testModel);
        expect(errorMessages.length).toBe(0);

        testControl.setErrors({required: true, minlength: 5});

        errorMessages = service.createErrorMessages(testControl, testModel);
        expect(errorMessages.length).toBe(1);
        expect(errorMessages[0]).toEqual((testModel.errorMessages as any)["required"]);

        testControl.setErrors({custom1: true});

        errorMessages = service.createErrorMessages(testControl, testModel);
        expect(errorMessages.length).toBe(1);
        expect(errorMessages[0]).toEqual(`Field ${testModel.id} has a custom error`);

        testControl.setErrors({custom2: {param: 42}});

        errorMessages = service.createErrorMessages(testControl, testModel);
        expect(errorMessages.length).toBe(1);
        expect(errorMessages[0]).toEqual("Field has a custom error: 42");
    });
});