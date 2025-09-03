package com.shpms.silverharvestsystem.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CartDTO implements SuperDTO {
    private String cartId;
    private String cropCode;
    private String cropName;
    private String cropImage;  // Image reference from Crop
    private int quantity;
    private String userId;
}
