const bangladeshDistricts = [
  { name: 'Dhaka', upazilas: ['Mirpur', 'Uttara', 'Gulshan', 'Banani', 'Dhanmondi', 'Motijheel', 'Old Dhaka'] },
  { name: 'Chittagong', upazilas: ['Chandgaon', 'Kotwali', 'Double Mooring', 'Khulshi', 'Panchlaish'] },
  { name: 'Khulna', upazilas: ['Khulna Sadar', 'Sonadanga', 'Daulatpur', 'Khalishpur'] },
  { name: 'Rajshahi', upazilas: ['Rajshahi Sadar', 'Boalia', 'Motihar'] },
  { name: 'Sylhet', upazilas: ['Sylhet Sadar', 'Kotwali', 'Jalalabad'] },
  { name: 'Barisal', upazilas: ['Barisal Sadar', 'Kotwali', 'Babuganj'] },
  { name: 'Rangpur', upazilas: ['Rangpur Sadar', 'Kotwali', 'Pirgachha'] },
  { name: 'Mymensingh', upazilas: ['Mymensingh Sadar', 'Trishal', 'Gafargaon'] },
  { name: 'Comilla', upazilas: ['Comilla Sadar', 'Kotwali', 'Chandina'] },
  { name: 'Narayanganj', upazilas: ['Narayanganj Sadar', 'Fatullah', 'Bandar'] }
];

const getDistricts = () => {
  return bangladeshDistricts.map(district => district.name);
};

const getUpazilasByDistrict = (districtName) => {
  const district = bangladeshDistricts.find(d => d.name === districtName);
  return district ? district.upazilas : [];
};
// Get upazilas by district - FIXED with exact matches
const getUpazilas = async (req, res) => {
  try {
    const { district } = req.params;
    
    // Standardized upazila names for each district
    const upazilaMap = {
      'Dhaka': ['Mirpur', 'Uttara', 'Gulshan', 'Dhanmondi', 'Motijheel', 'Banani', 'Farmgate', 'Mohammadpur'],
      'Chittagong': ['Chandgaon', 'Kotwali', 'Panchlaish', 'Khulshi', 'Double Mooring', 'Pahartali'],
      'Khulna': ['Khulna Sadar', 'Sonadanga', 'Daulatpur', 'Khalishpur', 'Boyra'],
      'Rajshahi': ['Rajshahi Sadar', 'Boalia', 'Motihar', 'Shah Makhdum'],
      'Sylhet': ['Sylhet Sadar', 'Kotwali', 'Jalalabad', 'Mogla Bazar', 'Bandar Bazar'],
      'Barisal': ['Barisal Sadar', 'Kotwali', 'Babuganj', 'Bakerganj', 'Gournadi'],
      'Rangpur': ['Rangpur Sadar', 'Kotwali', 'Pirgachha', 'Badarganj', 'Haragachh'],
      'Mymensingh': ['Mymensingh Sadar', 'Trishal', 'Gafargaon', 'Fulbaria', 'Ishwarganj'],
      'Comilla': ['Comilla Sadar', 'Kotwali', 'Chandina', 'Daudkandi', 'Homna'],
      'Narayanganj': ['Narayanganj Sadar', 'Fatullah', 'Bandar', 'Rupganj', 'Sonargaon']
    };
    
    const upazilas = upazilaMap[district] || [];
    
    res.status(200).json({
      success: true,
      upazilas
    });
  } catch (error) {
    console.error('Get upazilas error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting upazilas',
      error: error.message
    });
  }
};

module.exports = {
  getDistricts,
  getUpazilasByDistrict,
  bangladeshDistricts,
  getUpazilas 
};