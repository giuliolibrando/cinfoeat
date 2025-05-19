import React from 'react';
import { Navbar as BootstrapNavbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import logoWhite from '../assets/logo_white.png';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { texts } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <BootstrapNavbar 
      variant="dark" 
      expand="lg" 
      style={{ backgroundColor: '#8B0000' }}
    >
      <Container>
        <BootstrapNavbar.Brand as={Link} to="/">
          <img 
            src={logoWhite} 
            alt="CinfoEat Logo" 
            height="40" 
            className="d-inline-block align-top me-2"
          />
        </BootstrapNavbar.Brand>
        <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {isAuthenticated && (
              <>
                {user && user.isAdmin && (
                  <Nav.Link as={Link} to="/admin">
                    {texts.admin_panel}
                  </Nav.Link>
                )}
              </>
            )}
          </Nav>
          <Nav>
            {isAuthenticated ? (
              <>
                <NavDropdown 
                  title={`${texts.welcome}, ${user?.displayName || 'User'}`}
                  id="user-dropdown"
                  align="end"
                >
                  <NavDropdown.Item as={Link} to="/profile">
                    {texts.profile}
                  </NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogout}>
                    {texts.logout}
                  </NavDropdown.Item>
                </NavDropdown>
              </>
            ) : (
              <Nav.Link as={Link} to="/login">
                {texts.login}
              </Nav.Link>
            )}
          </Nav>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
};

export default Navbar; 