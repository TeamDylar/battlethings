'use strict';

describe('Service: Admin', function () {

  // load the service's module
  beforeEach(angular.mock.module('ss14Team113App'));

  // instantiate service
  var Admin;
  beforeEach(inject(function (_Admin_) {
    Admin = _Admin_;
  }));

  it('should do something', function () {
    expect(!!Admin).toBe(true);
  });

});
