import React, { useEffect, useState } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";

const CheckIn = ({sendData , close, initialType = "asset", hideTypeSwitch = false}) => {
  const [checkoutType, setCheckoutType] = useState(initialType);
  const [formData, setFormData] = useState({
    returnedBy: "",
    returnDateTime: "",
    returnedFrom: "",
    imageIn: null,
    spareFields: [{ id: 1, spareName: "", returnDateTime: "" }],
  });

  useEffect(() => {
    setCheckoutType(initialType);
  }, [initialType]);

  // Handle radio button selection change
  const handleSelectionChange = (event) => {
    setCheckoutType(event.target.value);
  };

  // Handle input change for both asset and spare
  const handleInputChange = (index, event) => {
    const { name, value } = event.target;
    if (index !== null) {
      const updatedSpareFields = [...formData.spareFields];
      updatedSpareFields[index][name] = value;
      setFormData({ ...formData, spareFields: updatedSpareFields });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Add a spare field
  const handleAddSpareField = () => {
    const newId = formData.spareFields.length + 1;
    setFormData({
      ...formData,
      spareFields: [
        ...formData.spareFields,
        { id: newId, spareName: "", returnDateTime: "" },
      ],
    });
  };

  // Remove a spare field
  const handleRemoveSpareField = (index) => {
    const updatedSpareFields = formData.spareFields.filter(
      (field, idx) => idx !== index
    );
    setFormData({ ...formData, spareFields: updatedSpareFields });
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
  
    reader.onloadend = () => {
      const imageString = reader.result;
      const base64String = imageString.split(',')[1]; // remove the "data:image/png;base64," part
      setFormData({ ...formData, imageIn: base64String });
    };
  
    reader.readAsDataURL(file); // start reading the file
  };


  // Handle form submission
  const handleSubmit = (event) => {
    event.preventDefault();
    sendData(formData); // Replace with actual form submission logic
    // Example: Send formData to server, reset form, etc.
    setFormData({
      returnedBy: "",
      returnDateTime: "",
      returnedFrom: "",
      uploadImage: null,
      spareFields: [{ id: 1, spareName: "", returnDateTime: "" }],
    });
    close();

  };

  return (
    <div className="transfer-action-form">
      <Form onSubmit={handleSubmit}>
        {/* Radio buttons to select checkout type */}
        {!hideTypeSwitch ? (
          <Form.Group>
            <Form.Check
              type="radio"
              id="check-asset"
              label="Check In Asset"
              value="asset"
              checked={checkoutType === "asset"}
              onChange={handleSelectionChange}
            />
            <Form.Check
              type="radio"
              id="check-spare"
              label="Check In Spare"
              value="spare"
              checked={checkoutType === "spare"}
              onChange={handleSelectionChange}
            />
          </Form.Group>
        ) : null}

        {/* Asset check-in form */}
        {checkoutType === "asset" && (
          <div>
            <Form.Group controlId="returnedBy">
              <Form.Label>Returned By</Form.Label>
              <Form.Control
                type="text"
                name="returnedBy"
                value={formData.returnedBy}
                onChange={(e) => handleInputChange(null, e)}
                required
              />
            </Form.Group>

            <Form.Group controlId="returnDateTime">
              <Form.Label>Return Date & Time</Form.Label>
              <Form.Control
                type="datetime-local"
                name="returnDateTime"
                value={formData.returnDateTime}
                onChange={(e) => handleInputChange(null, e)}
                required
              />
            </Form.Group>

            <Form.Group controlId="returnedFrom">
              <Form.Label>Returned From</Form.Label>
              <Form.Control
                type="text"
                name="returnedFrom"
                value={formData.returnedFrom}
                onChange={(e) => handleInputChange(null, e)}
              />
            </Form.Group>

            <Form.Group controlId="uploadImage">
              <Form.Label>Upload Image</Form.Label>
              <Form.Control
                type="file"
                name="uploadImage"
                onChange={handleImageChange}
                // onChange={(e) =>
                //   setFormData({ ...formData, uploadImage: e.target.files[0] })
                // }
                accept="image/*"
              />
            </Form.Group>
          </div>
        )}

        {/* Spare check-in form */}
        {checkoutType === "spare" && (
          <div>
            {formData.spareFields.map((field, index) => (
              <div key={field.id}>
                <Form.Group>
                  <Form.Label>Spare Name {index + 1}</Form.Label>
                  <Form.Control
                    type="text"
                    name="spareName"
                    value={field.spareName}
                    onChange={(e) => handleInputChange(index, e)}
                    required
                  />
                </Form.Group>

                <Form.Group>
                  <Form.Label>Return Date & Time {index + 1}</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    name="returnDateTime"
                    value={field.returnDateTime}
                    onChange={(e) => handleInputChange(index, e)}
                    required
                  />
                </Form.Group>

                {index > 0 && (
                  <Button
                    variant="danger"
                    onClick={() => handleRemoveSpareField(index)}
                    className="my-2"
                  >
                    Remove Spare
                  </Button>
                )}
              </div>
            ))}

            <Button
              variant="primary"
              onClick={handleAddSpareField}
              className="mt-2"
            >
              Add Spare
            </Button>
          </div>
        )}

        {/* Common fields for both asset and spare check-in */}
        {checkoutType === "spare" && (
          <>
            <Form.Group controlId="returnedBy">
              <Form.Label>Returned By</Form.Label>
              <Form.Control
                type="text"
                name="returnedBy"
                value={formData.returnedBy}
                onChange={(e) => handleInputChange(null, e)}
                required
              />
            </Form.Group>

            <Form.Group controlId="returnedFrom">
              <Form.Label>Returned From</Form.Label>
              <Form.Control
                type="text"
                name="returnedFrom"
                value={formData.returnedFrom}
                onChange={(e) => handleInputChange(null, e)}
              />
            </Form.Group>

            <Form.Group controlId="uploadImage">
              <Form.Label>Upload Image</Form.Label>
              <Form.Control
                type="file"
                name="uploadImage"
                onChange={handleImageChange}
                // onChange={(e) =>
                //   setFormData({ ...formData, uploadImage: e.target.files[0] })
                // }
                accept="image/*"
              />
            </Form.Group>
          </>
        )}
      <div className="form-footer mt-3 d-flex justify-content-between ">
      <Button variant="primary" type="submit" className="mt-3 px-3 ">
          Check In
        </Button>
        <Button variant="secondary" className="mt-3 px-4" onClick={close}>
          Close
        </Button></div>
 
      </Form>
    </div>
    
    
  );
};

export default CheckIn;
